# Runbook — Tier 0 de Segurança (ações fora do repositório)

> As ações abaixo **não podem ser feitas por commit** — exigem acesso ao projeto
> Supabase, ao projeto Vercel e à conta GitHub. Os arquivos correspondentes já estão
> prontos no repositório; falta executar. **Nenhum dado real de paciente entra no sistema
> antes de todos os itens estarem marcados** (`docs/07`, `SECURITY.md`).
>
> Dono: **Ota** (com o dev de segurança). Autorização de orçamento: **André**.

---

## 1. SEC-01 · Rotação de segredos

- [ ] **Rotacionar a senha do banco Supabase** (Settings → Database → Reset password).
      Driver: a senha foi compartilhada em canal de chat durante o desenvolvimento.
- [ ] Rotacionar a `service_role` key se estiver em uso em qualquer lugar. Ela **nunca**
      vai ao cliente — só a `publishable`/anon (isso é correto por design).
- [ ] **Chave do Google Maps:** o código não tem mais chave embutida (removida em
      ago/2026). Antes do próximo deploy, definir `VITE_GOOGLE_MAPS_API_KEY` no projeto
      Vercel (Production + Preview). Sem a variável os mapas caem no embed público
      keyless — funcionam, sem personalização. Rotacionar a chave antiga de prototipagem
      no Google Cloud e restringir a nova por referrer + alerta de billing.
- [ ] Rodar `gitleaks`/`trufflehog` no histórico do repositório; decidir entre limpar o
      histórico ou considerar as credenciais antigas queimadas (todas rotacionadas).
- [ ] Registrar o **inventário de segredos** (onde mora cada um: Vercel env, Supabase,
      Google Cloud, Deepgram) em local controlado — não no repositório.

## 2. SEC-02 · Cifragem em trânsito e repouso

- [x] HSTS e CSP adicionados ao `vercel.json` (ago/2026).
- [ ] Após o próximo deploy, validar os headers em produção
      (`curl -I https://<host>` → `strict-transport-security`, `content-security-policy`).
- [ ] Documentar AES-256 em repouso (Postgres + Storage) a partir da documentação do
      Supabase — evidência, não declaração.
- [ ] ⚠️ **Se o `index.html` mudar o script inline de tema**, recalcular o hash do CSP:
      `sha256` do conteúdo entre `<script>` e `</script>` em base64. O hash atual é
      `sha256-zmZswH/3+EK7ruRSpynkw3sfaN8ZpuH4ts7Cg9RyI7A=`. Se ficar desatualizado, o
      script é bloqueado e o tema cai no padrão dark (não quebra o app, mas corrija).

## 3. SEC-03 · MFA/TOTP

- [ ] Habilitar TOTP no Supabase Auth.
- [ ] Tornar **obrigatório** para `REGULADOR`, `GESTOR`, `ADMIN_TENANT`; recomendado
      para `TARM`/`VIATURA`.
- [ ] Fluxo de enrolamento no primeiro login + códigos de recuperação.
- [ ] Ajustar o front para o desafio TOTP (hoje o card do login apenas informa que o MFA
      é habilitado em produção).

## 4. SEC-04 · RLS e menor privilégio

- [ ] Confirmar RLS habilitado e deny-by-default em todas as tabelas.
- [ ] Testes automatizados (entram no CI): tenant A não lê linha de B; `GESTOR` recebe
      0 linhas em `ocorrencias`/`despachos`; `VIATURA` lê apenas o despacho atribuído
      (**hoje a policy de `viaturas` permite qualquer papel do tenant ler tudo — ajustar**).
- [ ] Confirmar `meu_tenant()`/`meu_role()` como `security definer` com `search_path` fixo.

## 5. SEC-05 · Cadeia de auditoria (hash-chain)

- [ ] Revisar e **aplicar** `supabase/migrations/0001_audit_hash_chain.sql` (escrita, nunca
      aplicada). Implementa `hash_atual = sha256(hash_anterior || payload)`, bloqueia
      UPDATE/DELETE e cria `verificar_cadeia_auditoria(tenant)`.
- [ ] Rodar `select * from verificar_cadeia_auditoria('<tenant_id>')` e guardar a saída.
- [ ] Só depois disso a UI pode deixar de dizer "encadeamento em homologação".

## 6. SEC-06 · Backups e restore

- [ ] Habilitar PITR (exige plano Pro/Team) e definir retenção por política.
- [ ] **Drill de restore** em projeto separado, com RTO e RPO medidos e documentados.
- [ ] Avaliar cópia offsite imutável para produção.

## 7. SEC-07 · Residência de dados

- [ ] Confirmar e documentar que o projeto está na região **São Paulo**.
- [ ] Mapear a região de processamento de cada sub-processador (Storage, STT, LLM) —
      insumo do DPA (SEC-17) e da DPIA (SEC-16).

## 8. Seed e ambiente de demonstração

- [ ] Aplicar o `supabase/seed.sql` atualizado (4 logins: `TARM-04`, `REG-02`, `USA-01`,
      `GESTOR-01`). **Substituir `TROQUE_ESTA_SENHA`** pela senha do ambiente de
      demonstração antes de rodar — a senha não fica no repositório e não vem mais
      pré-preenchida no formulário de login.
- [ ] Ambiente com dado real **não usa este seed**: usuários criados pelo painel, senha
      individual, MFA obrigatório.

## 9. Infraestrutura de código (SEC-14)

- [ ] Transferir os repositórios para a organização GitHub `samais` (decisão de
      30/07/2026 registrada no Samais-OS) e **tornar o repositório privado** antes de
      qualquer dado real.
- [ ] Habilitar CodeQL, Dependabot, secret scanning + push protection; SBOM no build.
- [ ] Reautorizar o GitHub App da Vercel na organização.

## 10. Conformidade (encaminha o Tier 1)

- [ ] Nomear DPO/encarregado (SEC-16) e publicar o contato.
- [ ] DPIA/RIPD por finalidade (operação 192 é finalidade distinta de qualquer uso
      secundário de dados).
- [ ] Runbook de incidente com fluxo de notificação à ANPD e aos titulares.
- [ ] DPA assinado com cada sub-processador antes de ligar (Supabase, Vercel, Deepgram,
      Google) — SEC-17.

---

**Critério de saída do Tier 0:** todos os itens acima marcados, CI verde, restore
testado e documentado, e a demo funcionando com os 4 logins reais. A partir daí o
produto pode receber dado real em ambiente de piloto (`docs/12`, fase F2).

# Backlog de Segurança — Samais CoPilot OS

> Tickets acionáveis para o handoff ao dev de segurança. Cada item: **driver** (por que), **toca** (onde no código/schema), **critério de aceite** (checkboxes), **esforço** (S < 1d · M 1–3d · L > 3d), **depende**.
> Ordem de execução: **Tier 0 inteiro antes de qualquer dado real de paciente** → Tier 1 antes do 1º contrato público → Tier 2 puxado por contrato/certificação (ver `docs/06-...` e os docs estratégicos no vault).
> Referências de arquitetura: `supabase/schema.sql`, `supabase/seed.sql`, `src/lib/supabase.ts`, `docs/05-review-operacional.md`.

---

## TIER 0 — Antes de tocar dado real (custo ~zero, vem da stack)

### SEC-01 · Rotação de segredos + higiene · S
- **Driver:** a senha do banco Supabase foi compartilhada em canal de chat durante o desenvolvimento (exposição). Chaves de serviço nunca em código.
- **Toca:** Supabase (Database → Reset password); `.env` (já em `.gitignore`); histórico git.
- **Aceite:**
  - [ ] Senha do banco rotacionada; credenciais antigas invalidadas.
  - [ ] `service_role` key (se em uso) rotacionada; nunca exposta ao cliente (só a `publishable`/anon vai ao browser — isso é correto por design).
  - [ ] Scan do histórico git por segredos (gitleaks/trufflehog) — limpo ou history reescrito.
  - [ ] Inventário de segredos documentado (onde mora cada um).

### SEC-02 · Cifragem em trânsito e repouso — tornar claim verdadeiro · S
- **Driver:** UI afirma AES-256/TLS; precisa de evidência, não declaração.
- **Toca:** Supabase/Vercel (defaults); banner LGPD no Dashboard (`src/App.tsx`).
- **Aceite:**
  - [ ] TLS 1.3 forçado (HSTS no Vercel); sem downgrade.
  - [ ] AES-256 em repouso confirmado e documentado (Postgres + Storage).
  - [ ] Claims da UI alinhados ao real (ver SEC-20).

### SEC-03 · MFA/TOTP obrigatório para perfis com PII · M
- **Driver:** acesso a dado sensível exige segundo fator (LGPD boas práticas; exigência de comprador público).
- **Toca:** Supabase Auth (MFA); `handleLogin` em `src/App.tsx`; `src/lib/supabase.ts`.
- **Aceite:**
  - [ ] TOTP habilitado no Supabase Auth.
  - [ ] MFA **obrigatório** para `REGULADOR`, `GESTOR`, `ADMIN_TENANT`; recomendado p/ `TARM`/`VIATURA`.
  - [ ] Códigos de recuperação emitidos e armazenados com segurança.
  - [ ] Fluxo de enrolamento no 1º login.

### SEC-04 · Auditoria de cobertura RLS + menor privilégio · M
- **Driver:** isolamento por tenant é o coração do multi-tenant; gestor não pode ver PII.
- **Toca:** todas as policies em `supabase/schema.sql`.
- **Aceite:**
  - [ ] Toda tabela com RLS habilitado e **deny-by-default**.
  - [ ] Teste automatizado: usuário do tenant A não lê linha do tenant B.
  - [ ] Teste automatizado: `GESTOR` recebe `0 rows` em `ocorrencias`/`despachos` e só lê `metricas_gestor`.
  - [ ] Teste: `VIATURA` só lê o despacho atribuído.
  - [ ] `meu_tenant()`/`meu_role()` revisadas como `security definer` com `search_path` fixo (já estão — confirmar).

### SEC-05 · Audit log com hash encadeado — IMPLEMENTAR · M
- **Driver:** a coluna `hash_anterior` existe em `auditoria` mas **nada a computa** hoje. Sem o encadeamento, não há imutabilidade verificável.
- **Toca:** `supabase/migrations/0001_audit_hash_chain.sql` (migration pronta para revisão neste repo).
- **Aceite:**
  - [ ] Trigger calcula `hash_atual = sha256(hash_anterior || payload_canônico)` no INSERT.
  - [ ] `UPDATE`/`DELETE` em `auditoria` revogados (já estão — confirmar após migration).
  - [ ] Função `verificar_cadeia_auditoria(tenant)` detecta qualquer adulteração.
  - [ ] Toda ação clínica/despacho/acesso a PII grava em `auditoria` (instrumentar a app).

### SEC-06 · Backups imutáveis + restore testado · S
- **Driver:** ransomware é o ataque nº1 contra saúde pública; backup que não restaura não é backup.
- **Toca:** Supabase (PITR/backups).
- **Aceite:**
  - [ ] PITR habilitado; retenção definida em política.
  - [ ] Drill de restore executado e documentado (RTO/RPO medidos).
  - [ ] Cópia imutável/offsite considerada para produção.

### SEC-07 · Residência de dados br-saopaulo · S
- **Driver:** LGPD + soberania digital (alinha ao discurso UE-Brasil).
- **Aceite:**
  - [ ] Projeto Supabase em região São Paulo confirmado e documentado.
  - [ ] Sub-processadores (Storage, STT, LLM) mapeados quanto à região.

---

## TIER 1 — Antes do 1º contrato público (custo moderado)

### SEC-10 · Pseudonimização: separar cofre de PII do dado clínico · L
- **Driver:** minimização (LGPD art. 6) e pré-requisito do pipeline APH-BR. Hoje `ocorrencias` mistura telefone/dado do paciente com o clínico.
- **Toca:** `supabase/schema.sql` (nova tabela `paciente_pii`); migration.
- **Aceite:**
  - [ ] `ocorrencias` referencia `patient_token` (UUID), não PII direta.
  - [ ] Tabela `paciente_pii` (cpf, cns, nome, telefone) com RLS mais estrita que a clínica.
  - [ ] Re-identificação só por papel autorizado, **sempre auditada** (grava em `auditoria`).
  - [ ] `metricas_gestor` continua sem qualquer PII.

### SEC-11 · Cifragem em nível de campo + envelope/KMS para o cofre PII · M
- **Driver:** disco cifrado não basta; PII direta merece cifragem por campo e chave gerenciada.
- **Toca:** `paciente_pii` (pgsodium/pgcrypto ou cifragem na app); KMS.
- **Aceite:**
  - [ ] Campos diretos cifrados (chave fora do banco / envelope encryption).
  - [ ] Procedimento de rotação de chave documentado.

### SEC-12 · Carimbo de tempo confiável (RFC 3161) na auditoria · M
- **Driver:** valor probatório/jurídico do log (TCU/MP/ANPD).
- **Aceite:**
  - [ ] Lote de auditoria recebe token de TSA confiável.
  - [ ] Verificação documentada.

### SEC-13 · WAF + rate limiting + proteção DDoS · S
- **Toca:** Vercel/Cloudflare; endpoints de auth e API.
- **Aceite:**
  - [ ] WAF ativo; regras OWASP.
  - [ ] Rate limit em login e rotas sensíveis; proteção a brute-force.

### SEC-14 · CI seguro (SAST, deps, SBOM, secret scan) · M
- **Toca:** GitHub Actions (não há CI hoje).
- **Aceite:**
  - [ ] CodeQL (SAST) bloqueando PR em finding crítico.
  - [ ] Dependabot/Snyk para dependências.
  - [ ] Secret scanning + push protection habilitados.
  - [ ] SBOM gerado no build.

### SEC-15 · Pentest por terceiro + remediação · M
- **Driver:** exigido em parte das licitações; valida o Tier 0/1.
- **Aceite:**
  - [ ] Relatório de pentest (web + API).
  - [ ] Críticos/altos corrigidos e re-testados.

### SEC-16 · DPO + DPIA/RIPD + runbook de incidente · M
- **Aceite:**
  - [ ] DPO nomeado e publicado.
  - [ ] RIPD por finalidade (operação 192; APH-BR é finalidade distinta).
  - [ ] Runbook de incidente com fluxo de notificação ANPD e titulares.

### SEC-17 · DPA / contratos de suboperador · S
- **Driver:** Deepgram, Google (LLM/Maps), Supabase, Vercel processam dado em nome da Samais.
- **Aceite:**
  - [ ] DPA assinado com cada sub-processador.
  - [ ] Registro público de sub-processadores.

### SEC-18 · MDM + gestão de sessão (tablets de viatura) · M
- **Aceite:**
  - [ ] MDM em modo quiosque; wipe remoto.
  - [ ] TTL de sessão + rotação de refresh token + revogação no logout (parcialmente feito em `signOut`).

### SEC-20 · Registro de claims de conformidade · S
- **Driver:** risco reputacional de vender compliance inexistente (ver `SECURITY.md`).
- **Toca:** banner LGPD e textos no `src/App.tsx` e na LP.
- **Aceite:**
  - [ ] Cada claim mapeado a um controle implementado **ou** rotulado "roadmap".
  - [ ] Nenhuma afirmação não-lastreada apresentada como ativa.

---

## TIER 2 — Escala / certificação (puxado por contrato ou ângulo UE)

- **SEC-30** ISO 27001 (ISMS) + ISO 27799 (saúde) + SOC 2 Type II. **L+** (R$ 100–300k+ em ~1 ano). Não iniciar sem contrato que pague.
- **SEC-31** Pipeline de anonimização APH-BR: k-anonimato + l-diversidade + privacidade diferencial. **L** — habilita a venda de dados sob o corredor UE-Brasil (adequação jan/2026).
- **SEC-32** (opcional, barato) Ancoragem pública do Merkle root da auditoria (OpenTimestamps/Bitcoin) → "auditável por terceiros" sem confiar na Samais. Centavos por âncora. **S.** Alternativa honesta e barata ao "blockchain" — DLT completa foi avaliada e **descartada** (custo alto, ganho nulo para operador único; ver doc no vault "Cibersegurança, blockchain e ângulo UE-Brasil").

---

## Mapa de ameaças resumido (STRIDE leve)

| Ameaça | Mitigação principal | Ticket |
|---|---|---|
| Vazamento de PII entre tenants | RLS deny-by-default + testes | SEC-04 |
| Adulteração de registro clínico/decisão | Audit hash-chain + TSA | SEC-05, SEC-12 |
| Ransomware | Backups imutáveis + restore testado | SEC-06 |
| Credencial comprometida | MFA + rotação + menor privilégio | SEC-01, SEC-03 |
| Re-identificação indevida | Pseudonimização + cifragem + auditoria | SEC-10, SEC-11 |
| Sub-processador maligno/vazado | DPA + minimização enviada a terceiros | SEC-17 |
| Abuso de API/brute-force | WAF + rate limit | SEC-13 |

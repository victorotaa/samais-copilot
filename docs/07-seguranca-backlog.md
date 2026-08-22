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
  - [x] `vite.config.ts` **não** injeta segredo no bundle — o `define` de `GEMINI_API_KEY`
    (sobra do scaffold, contornava a proteção do prefixo `VITE_`) foi removido em 16/08
    (parecer `docs/17` F-04). Runbook: conferir que a variável também não existe no
    ambiente de build da Vercel.
  - [x] Fallback hardcoded do projeto Supabase real removido de `src/lib/supabase.ts` —
    sem env o app roda em modo demo puro, sem tocar a rede (parecer `docs/17` F-05).
    ⚠️ Gate de merge: setar `VITE_SUPABASE_URL`/`VITE_SUPABASE_KEY` na Vercel **antes**
    (runbook `docs/14`), senão o login real da demo pública deixa de funcionar.

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
  - [ ] Views `security definer` inventariadas: cada uma com predicado de tenant interno
    (views não têm RLS própria — foi exatamente o furo SEC-08).
  - [ ] `pgaudit` avaliado/ligado antes do 1º dado real: **leitura** de prontuário é
    evento auditável (LGPD), e a trilha atual só cobre escrita (parecer `docs/17` §A.1).

### SEC-05 · Audit log com hash encadeado — IMPLEMENTAR · M
- **Driver:** a coluna `hash_anterior` existe em `auditoria` mas **nada a computa** hoje. Sem o encadeamento, não há imutabilidade verificável.
- **Toca:** `supabase/migrations/0001_audit_hash_chain.sql` — **aplicar somente a v2** (16/08): a v1 tinha corrida de concorrência, payload dependente de sessão e TRUNCATE aberto (parecer `docs/17` F-03; correções no próprio arquivo). A v1 aplicada produziria falso positivo de adulteração — o pior resultado para um controle cuja função é ser confiável.
- **Aceite:**
  - [ ] Trigger calcula `hash_atual = sha256(hash_anterior || payload_canônico)` no INSERT, **serializado por tenant** (lock consultivo).
  - [ ] Payload canônico independente de `DateStyle`/`TimeZone` (timestamp via `to_char` UTC).
  - [ ] `UPDATE`/`DELETE`/`TRUNCATE` em `auditoria` bloqueados (grants + triggers, inclusive de comando).
  - [ ] Função `verificar_cadeia_auditoria(tenant)` detecta qualquer adulteração — e **não acusa** sob inserts concorrentes (testar com 2+ sessões simultâneas).
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

### SEC-08 · Isolamento de tenant na view `metricas_gestor` · S
- **Driver:** achado **F-01 do parecer independente** (`docs/17`), CRÍTICO: a view era
  `security definer` **sem predicado de tenant** — qualquer autenticado lia métricas
  agregadas de todas as centrais (volume, vermelhos, divergências, tempo de resposta).
  Entre municípios concorrentes na mesma plataforma, é vazamento comercial e contratual.
- **Toca:** `supabase/schema.sql` (corrigido em 16/08) · `supabase/migrations/0002_fix_rls_metricas_auditoria.sql` (retrofit).
- **Nota de desenho:** a view **permanece** definer de propósito — `GESTOR` não tem
  policy de select em `ocorrencias` ("gestor sem PII por construção"); `security_invoker`
  o deixaria sem painel. O isolamento vem do `where tenant_id = meu_tenant()` interno.
- **Aceite:**
  - [ ] Migration `0002` aplicada no projeto vivo.
  - [ ] `pg_get_viewdef('metricas_gestor')` contém o predicado de tenant.
  - [ ] Logado num tenant, `select distinct tenant_id from metricas_gestor` → 1 linha.
  - [ ] `anon` sem grant na view.

### SEC-09 · Auditoria íntegra na origem · S
- **Driver:** achado **F-02 do parecer** (`docs/17`), ALTO: a policy de insert não
  amarrava `usuario_id` ao `auth.uid()` — qualquer usuário do tenant inseria registro de
  auditoria **em nome de outro operador**. Cadeia de hash sobre registro forjado na origem
  é pior que nenhuma: sustenta afirmação falsa em juízo (o hash prova que não mudou
  *depois*, não que era verdadeiro *quando gravado*).
- **Toca:** `supabase/schema.sql` (corrigido em 16/08) · migration `0002` (retrofit) ·
  complementa SEC-05 (que garante a integridade *depois* da gravação).
- **Aceite:**
  - [ ] Migration `0002` aplicada; `with check` contém `usuario_id = auth.uid()`.
  - [ ] Teste: insert com `usuario_id` de outro usuário → recusado.
  - [ ] TRUNCATE revogado de `anon`/`authenticated` (conferir grants default do Supabase).

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

### SEC-19 · Gestão de identidade dentro do produto (offboarding) · M
- **Driver:** achado **F-08 do parecer** (`docs/17`): não há policy de insert/update em
  `usuarios` — criar operador, trocar papel e **desativar demitido** exigem `service_role`
  fora da aplicação, manualmente. Numa central com rotatividade de plantão, offboarding
  vira processo humano não rastreado; menor privilégio sem revogação é menor privilégio
  no papel.
- **Toca:** `supabase/schema.sql` (policies de `usuarios`) · painel `ADMIN_TENANT` (a
  criar) · `auditoria` (toda mudança de identidade gravada).
- **Aceite:**
  - [ ] `ADMIN_TENANT` cria/desativa usuário **do próprio tenant** pela aplicação, com
    registro em `auditoria`.
  - [ ] Desativação corta sessão ativa (revogação de refresh token).
  - [ ] Processo de offboarding documentado (quem pede, quem executa, em quanto tempo).

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
| Vazamento de **agregados** entre tenants (views definer) | Predicado de tenant dentro da view + inventário de views | SEC-08 |
| Adulteração de registro clínico/decisão | Audit hash-chain + TSA | SEC-05, SEC-12 |
| **Forja de autoria** na auditoria (registro em nome de outro) | `usuario_id = auth.uid()` na policy de insert | SEC-09 |
| Ransomware | Backups imutáveis + restore testado | SEC-06 |
| Credencial comprometida | MFA + rotação + menor privilégio | SEC-01, SEC-03 |
| Segredo vazado pelo bundle do cliente | Nenhum `define`/hardcode; chave de serviço só em camada servidor | SEC-01 |
| Acesso remanescente de ex-operador | Offboarding rastreado + revogação de sessão | SEC-19 |
| Re-identificação indevida | Pseudonimização + cifragem + auditoria | SEC-10, SEC-11 |
| Sub-processador maligno/vazado | DPA + minimização enviada a terceiros | SEC-17 |
| Abuso de API/brute-force | WAF + rate limit | SEC-13 |

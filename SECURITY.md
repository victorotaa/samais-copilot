# Política de Segurança — Samais CoPilot OS

> Produto de saúde que trata **dados pessoais sensíveis** de pacientes em contexto de **saúde pública** (Central 192 / APH). Segurança é pré-requisito de operação e de venda, não funcionalidade opcional.

## Estado atual (transparência para quem assume o projeto)

Este repositório é, hoje, um **protótipo navegável de alta fidelidade** com backend inicial (Supabase). Vários controles de segurança **ainda não estão implementados** — estão especificados em [`docs/07-seguranca-backlog.md`](docs/07-seguranca-backlog.md). **Nenhum dado real de paciente deve trafegar neste sistema antes de fechar o Tier 0 do backlog.**

Claims de conformidade exibidos na UI (AES-256, SHA-256, audit log, "pronto para ANPD/TCU/MP") são hoje **declarativos**. Há um item de backlog dedicado a casar cada claim a um controle implementado ou rotulá-lo como roadmap (SEC-20). Não apresentar a compradores como implementado o que não está.

## Base legal e padrões de referência

- **LGPD** (Lei 13.709/2018) — dado de saúde é sensível (art. 11); base legal típica em saúde pública: tutela da saúde / obrigação legal / política pública.
- **ANPD** — notificação de incidente, RIPD/DPIA por finalidade.
- Alvo de maturidade: **ISO/IEC 27001** (ISMS), **ISO 27799** (segurança em saúde), **SOC 2 Type II**.
- Interoperabilidade: **FHIR R4** (alinhado à direção europeia / European Health Data Space — relevante ao corredor de dados UE-Brasil, adequação mútua jan/2026).

## Reporte de vulnerabilidades

Reportar a **seguranca@samais.com.br** (PGP sob demanda). Não abrir issue pública para vulnerabilidade. Prazo-alvo de primeira resposta: 72h. Não realizar testes de carga/intrusão contra ambientes de produção sem autorização escrita.

## Princípios não-negociáveis

1. **Menor privilégio por padrão** (deny-by-default em RLS).
2. **Gestor não acessa PII** — consome apenas agregados (view `metricas_gestor`).
3. **Auditoria imutável** — `auditoria` é append-only, com hash encadeado verificável.
4. **Segredo nunca em código** — variáveis de ambiente / secret manager; rotação documentada.
5. **A IA é copiloto** — decisão clínica e despacho são do profissional; tudo registrado.

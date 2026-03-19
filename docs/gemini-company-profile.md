# Briefing Gemini — Perfil da Empresa

## Objetivo

Implementar a página de frontend do módulo **Perfil da Empresa** usando o contrato já exposto pelo backend. Não criar novos campos nem alterar o schema por conta própria.

## Rota sugerida no frontend

- `/company-profile`

## Regras de acesso

- página restrita a `ADMIN`
- adicionar item visível apenas para admin na sidebar

## Contrato disponível

Usar o contrato compartilhado em `shared/routes.ts`:

- `GET /api/company-profile`
- `PUT /api/company-profile`

## Campos disponíveis hoje

Renderizar e editar apenas estes campos:

- `name`
- `city`
- `state`
- `urbanPercent`
- `tripPercent`

## O que cada campo representa

- `name`: nome da empresa/transportadora
- `city`: cidade base da operação
- `state`: UF da operação
- `urbanPercent`: percentual aplicado em cargas urbanas
- `tripPercent`: percentual aplicado em viagens

## Regras importantes

- não adicionar CNPJ, telefone, endereço completo ou logo como campos persistidos sem alinhamento com o Codex
- não mudar payload do backend
- não criar endpoint paralelo
- se precisar de novo campo, registrar no `docs/worklog.md`

## Expectativa de UX

- tela administrativa simples, clara e corporativa
- card ou formulário principal com os dados institucionais
- loading, erro e sucesso explícitos
- CTA de salvar com estado de pending
- microcopy deixando claro que os percentuais afetam o cálculo operacional dos romaneios

## Entrega esperada no handoff

Registrar no `docs/worklog.md`:

- arquivos alterados
- rota visual criada
- impacto na navegação/sidebar
- qualquer dúvida de contrato antes do redeploy

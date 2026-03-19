# Project Specs

## Identidade do projeto

- Nome visual alvo: `AF Silva Transportes`
- Nome técnico atual no código: `nextgateLOG` / `NextGate Log`
- Domínio alvo de produção: `app.afsilvatransportes.com.br`

## Objetivo

Aplicação web para gestão operacional e financeira de transportadora, com foco em:

- autenticação por e-mail para admin e CPF para operadores
- isolamento por tenant
- gestão de finanças
- gestão de invoices por ciclo quinzenal
- gestão de funcionários e pagamentos
- gestão de veículos
- gestão de carregamentos
- deploy em VPS via Coolify

## Stack atual

- Frontend: React + Vite + Tailwind + React Query
- Backend: Express + TypeScript
- Banco: PostgreSQL + Drizzle ORM
- Auth: `passport-local` + `express-session` + `connect-pg-simple`
- Uploads: filesystem local + metadados no banco
- Build: Vite para client + esbuild para server
- Deploy alvo: Dockerfile + Coolify

## Responsabilidades por agente

- Codex: backend, banco, auth, segurança, deploy, auditoria, correções estruturais
- Gemini: frontend, UI, UX, rebranding, componentes, responsividade

## Restrições operacionais

- Não redesenhar UI sem necessidade técnica no fluxo do Codex
- Não alterar contratos compartilhados sem registrar impacto
- Registrar mudanças relevantes em `docs/worklog.md`
- Antes de cada bloco: ler `README.md`, `specs.md`, `AGENTS.md` e checar `git status`

## Guia operacional para Gemini

- para mudanças de frontend e rebranding, consultar `docs/gemini-alignment.md`
- o deploy final deve acontecer uma única vez, depois que a UI estiver concluída e validada
- qualquer necessidade de ajuste em contrato, backend, auth, schema ou deploy deve ser registrada antes no `docs/worklog.md`

## Estado técnico atual

- `npm run check`: OK
- `npm run build`: OK
- Backend e build de produção já estão funcionando
- Deploy ainda não finalizado
- Frontend ainda não cobre todos os fluxos de negócio do escopo

## Escopo funcional alvo

- Login protegido
- Dashboard com KPIs operacionais/financeiros
- Finance: listagem, criação, filtros e anexos opcionais
- Invoices: criação, listagem, filtro e anexo obrigatório
- Employees: cadastro e pagamento mensal sem duplicidade
- Vehicles: cadastro e listagem
- Loadings: cadastro, listagem e cálculo automático de receita estimada
- Funcionários: cadastro com CPF e criação automática de login do operador
- PWA com manifest e service worker
- Perfil da Empresa com edição dos dados institucionais e percentuais operacionais

## Pendências prioritárias atuais

- implementar página de Perfil da Empresa consumindo o contrato compartilhado
- concluir fluxos de frontend faltantes para invoices e employee payments
- alinhar rebranding técnico e visual para AF Silva Transportes
- aplicar `npm run db:push` em ambiente com `DATABASE_URL`
- preparar deploy final no Coolify com banco, envs, volume e domínio

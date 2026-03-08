# Execution Checklist

## Uso

Este arquivo é a checklist principal de execução do projeto. Atualizar status ao fim de cada bloco relevante.

Legenda:

- `[ ]` pendente
- `[-]` em andamento
- `[x]` concluído

## Fase 1 — Auditoria e base operacional

- [x] Ler `README.md`
- [x] Ler `AGENTS.md`
- [x] Criar `specs.md`
- [x] Validar `git status` antes do trabalho
- [x] Mapear stack e arquitetura
- [x] Validar `npm run check`
- [x] Validar `npm run build`
- [x] Gerar `docs/audit-report.md`
- [x] Criar `docs/worklog.md`

## Fase 2 — Segurança e regras críticas

- [x] Revisar autenticação e sessão
- [x] Remover exposição de senha em respostas/sessão
- [x] Revisar logs sensíveis
- [x] Proteger uploads por tenant
- [x] Validar vínculos por tenant nas rotas críticas
- [x] Bloquear pagamento mensal duplicado
- [x] Ajustar regra de invoice quinzenal do dashboard
- [x] Aplicar schema no banco com `npm run db:push`

## Fase 3 — Conclusão funcional do backend

- [x] Revisar necessidade de autorização por papel
- [x] Decidir escopo final de rotas `PUT/PATCH/DELETE`
- [x] Ajustar autenticação para `CPF ou e-mail`
- [x] Criar operador automaticamente a partir do cadastro de funcionário
- [ ] Implementar rotas faltantes para CRUD completo, se necessário
- [x] Revisar tratamento padronizado de erros
- [x] Revisar headers de segurança para produção

## Fase 4 — Fluxos faltantes no frontend

- [x] Criar fluxo de invoices com upload obrigatório
- [x] Criar filtros de invoice por `competenceMonth` e `periodType`
- [x] Criar tela de pagamentos mensais de employees
- [x] Expor prevenção de duplicidade na UI
- [x] Adaptar login para `CPF ou e-mail`
- [x] Expor cadastro de funcionário com CPF e credenciais iniciais do operador
- [x] Revisar estados de loading/erro/vazio
- [x] Validar integração frontend com contratos de `shared`

## Fase 5 — Rebranding AF Silva Transportes

- [ ] Substituir nome visual residual de `NextGate` / `FleetMgr`
- [ ] Revisar manifest e metadados
- [ ] Revisar favicon, nome do app e identidade visual
- [ ] Validar impacto técnico do rebranding em produção

## Fase 6 — Deploy no Coolify

- [ ] Definir envs finais de produção
- [ ] Criar banco PostgreSQL no Coolify
- [x] Configurar `DATABASE_URL`
- [x] Rodar `npm run db:push`
- [ ] Configurar volume persistente em `/app/uploads`
- [ ] Configurar healthcheck `/healthz`
- [ ] Configurar domínio `app.afsilvatransportes.com.br`
- [ ] Validar SSL e roteamento
- [ ] Executar smoke test pós-deploy

## Fase 7 — Encerramento

- [ ] Atualizar `docs/worklog.md` com handoff final
- [ ] Revisar arquivos compartilhados alterados
- [ ] Consolidar pendências finais

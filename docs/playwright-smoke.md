# Playwright Smoke Suite

## Objetivo
Cobrir primeiro API e depois UI com a mesma base de credenciais, evitando publicar uma versão quebrada e reduzindo retrabalho pós-deploy.

## Ordem correta
1. Rodar `api-smoke` antes do redeploy no ambiente controlado.
2. Se passar, publicar.
3. Rodar `api-smoke` + `ui-smoke` de novo na URL publicada.

Resumo:
- antes do redeploy: valida contrato, auth, permissões e fluxos seguros
- depois do redeploy: valida build real, cache, service worker, renderização e navegação final

## Variáveis necessárias
```bash
export E2E_BASE_URL="http://127.0.0.1:5000"
export E2E_ADMIN_LOGIN="19130154000126"
export E2E_ADMIN_PASSWORD="afs051317"
```

Para produção publicada, trocar apenas `E2E_BASE_URL`.

## Comandos
```bash
npx -y @playwright/test@1.58.2 test --project=api-smoke
npx -y @playwright/test@1.58.2 test --project=ui-smoke
npx -y @playwright/test@1.58.2 test
```

## Cobertura atual
- `api-smoke`
  - `healthz`
  - login/logout/admin session
  - `GET /api/user`
  - `GET/PUT /api/profile`
  - `GET/PUT /api/company-profile` com payload no-op
  - listagens principais: dashboard, financeiro, invoices, employees, employee-payments, vehicles, loadings, categories
  - criação temporária de funcionário
  - login do operador temporário
  - validação de permissões do operador
  - exclusão segura do funcionário temporário
- `ui-smoke`
  - login admin
  - navegação dashboard -> meu perfil -> empresa
  - save no-op em perfil
  - exclusão de funcionário pela UI
  - login operador
  - validação visual de restrições do operador

## Limite intencional
Rotas sem endpoint de limpeza, como criação irreversível de veículo, financeiro, invoice e upload, não devem ser exercitadas diretamente em produção. Essas devem rodar só em ambiente local/staging com massa isolada.

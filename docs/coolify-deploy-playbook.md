# Coolify Deploy Playbook

## Objetivo

Subir o `nextgate-log` em produção no Coolify com PostgreSQL, volume persistente de uploads e smoke test mínimo.

## Pré-requisitos

- código atualizado no diretório/repositório usado pelo Coolify
- serviço PostgreSQL criado no Coolify
- domínio de produção definido
- variáveis de ambiente configuradas

## Variáveis obrigatórias

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=string-longa-e-aleatoria
NODE_ENV=production
PORT=5000
```

## Variáveis opcionais do primeiro deploy

```env
SEED_DATA=true
SEED_ADMIN_EMAIL=admin@nextgatelog.local
SEED_ADMIN_PASSWORD=defina-uma-senha-forte
```

Depois do primeiro acesso:

```env
SEED_DATA=false
```

## Configuração da aplicação no Coolify

1. Criar uma nova aplicação por `Dockerfile`.
2. Apontar para a pasta/repositório do projeto `nextgate-log`.
3. Confirmar a porta interna `5000`.
4. Configurar healthcheck em `GET /healthz`.
5. Configurar volume persistente para `/app/uploads`.
6. Configurar domínio e SSL.

## Ordem correta do primeiro deploy

1. Criar o PostgreSQL.
2. Configurar `DATABASE_URL` e `SESSION_SECRET`.
3. Fazer o deploy inicial da aplicação.
4. Entrar no terminal da aplicação e rodar:

```bash
npm run db:push
```

5. Reiniciar/redeployar a aplicação.
6. Confirmar criação do admin seed, se o seed estiver habilitado.

## Verificações pós-deploy

### 1. Healthcheck

```bash
curl -i https://SEU_DOMINIO/healthz
```

Esperado: `200` com body parecido com:

```json
{"status":"ok"}
```

### 2. Login admin

- acessar `/auth`
- autenticar com credenciais do seed ou admin já existente

### 3. Smoke test funcional

Executar manualmente:

1. cadastrar um veículo
2. cadastrar um funcionário com CPF
3. validar login do operador com CPF e senha dos 4 últimos dígitos
4. registrar um romaneio em `/loadings`
5. voltar ao admin e validar dashboard operacional
6. cadastrar uma NF com anexo em `/invoices`
7. validar entrada correspondente no `/finance`
8. registrar um pagamento mensal em `/employees`
9. validar despesa correspondente no `/finance`

## Observações de operação

- `romaneio/frete` é operacional e não deve ser tratado como receita real
- `NF` e `employee payments` alimentam o financeiro real
- uploads dependem do volume persistente em `/app/uploads`
- as alterações recentes de schema exigem `npm run db:push` antes de considerar o deploy concluído

## Riscos conhecidos

- o bundle do client ainda gera warning de chunk acima de `500 kB`, mas o build está funcional
- ainda não há migrations versionadas; a operação atual depende de `drizzle-kit push`

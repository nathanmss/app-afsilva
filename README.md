# AF Silva Transportes

Sistema web para gestão de transportadora com dashboard, finanças, faturas, colaboradores, veículos e carregamentos.

## Stack

- Frontend: React + Vite + Tailwind + React Query
- Backend: Express + TypeScript
- Banco: PostgreSQL + Drizzle ORM
- Auth: `passport-local` + sessão em PostgreSQL (`connect-pg-simple`)
- Login:
  - `ADMIN`: pode usar e-mail
  - `OPERATOR`: usa CPF do cadastro de funcionário

## Rodar localmente

1. Instale dependências:

```bash
npm install
```

2. Configure variáveis:

```bash
cp .env.example .env
```

3. Garanta schema no banco:

```bash
npm run db:push
```

4. Suba a aplicação:

```bash
npm run dev
```

## Build de produção

```bash
npm run build
npm start
```

## Deploy no Coolify (Dockerfile)

1. Crie um serviço PostgreSQL no Coolify.
2. Crie uma aplicação apontando para este repositório/pasta com build por `Dockerfile`.
3. Configure variáveis de ambiente da aplicação:
   - `DATABASE_URL`: URL de conexão do PostgreSQL do Coolify
   - `SESSION_SECRET`: string longa e aleatória
   - `NODE_ENV=production`
   - `SEED_DATA=true` (somente no primeiro deploy, opcional)
   - `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` (recomendado no primeiro deploy)
4. Configure healthcheck para `GET /healthz`.
5. Configure volume persistente para `/app/uploads`.
6. Faça o primeiro deploy.
7. Rode uma vez o comando abaixo no terminal da aplicação (ou pre-deploy command) para criar/atualizar tabelas:

```bash
npm run db:push
```

8. Após o primeiro acesso, opcionalmente desative seed:
   - `SEED_DATA=false`

Guia operacional detalhado:

- ver `docs/coolify-deploy-playbook.md`

## Usuário inicial

- Em ambiente de desenvolvimento, se o seed estiver ativo e não existir usuário:
  - email: `admin@afsilvatransportes.local`
  - senha: `admin123`
- Em produção, o seed só cria usuário se `SEED_ADMIN_PASSWORD` for definido.
- Funcionários cadastrados pelo admin recebem acesso de operador:
  - login: CPF cadastrado
  - senha inicial: 4 últimos dígitos do CPF

# Guia de Alinhamento para Gemini

## Objetivo

Este arquivo existe para alinhar o trabalho do Gemini com o fluxo operacional já validado pelo Codex neste projeto.

O foco do Gemini continua sendo frontend, UI, UX, rebranding e consistência visual. O foco do Codex continua sendo backend, banco, auth, segurança, deploy e revisão estrutural.

## Leitura obrigatória antes de editar

1. `README.md`
2. `specs.md`
3. `AGENTS.md`
4. `docs/worklog.md`
5. este arquivo

## Onde o projeto roda hoje

- repositório ativo: `nextgate-log`
- deploy alvo: Coolify via `Dockerfile`
- domínio alvo: `app.afsilvatransportes.com.br`
- banco: PostgreSQL
- uploads persistentes em produção: `/app/uploads`
- healthcheck esperado em produção: `GET /healthz`

## Como o deploy funciona neste ambiente

O deploy final deve acontecer em um bloco único, depois que o Gemini concluir a UI e o Codex validar a integração técnica.

Fluxo correto:

1. Gemini conclui mudanças visuais e registra handoff.
2. Codex revisa impactos técnicos e arquivos compartilhados.
3. Codex valida `npm run check` e `npm run build`.
4. Só então acontece o redeploy no Coolify.
5. Depois do deploy, ocorre smoke test funcional completo.

## Regra prática para o Gemini

- Não disparar redeploy enquanto a UI ainda estiver em aberto.
- Não alterar backend, auth, rotas, schema ou contratos sem registrar a necessidade.
- Não mexer em `server/**`, `shared/**`, `Dockerfile`, `.env*` ou docs de deploy sem alinhamento explícito.
- Se precisar de mudança de contrato, registrar no `docs/worklog.md` e deixar claro o impacto.

## O que o Gemini deve registrar ao terminar

Sempre deixar um handoff em `docs/worklog.md` com:

- agente
- área
- arquivos alterados
- resumo
- impacto
- pendências

Além disso, quando a mudança exigir publicação, informar explicitamente:

- se precisa de redeploy
- se alterou manifest, favicon, logo, `index.html` ou metadados PWA
- se existe algum ponto que o Codex precisa revisar antes da publicação

## Itens de frontend que afetam deploy

Se qualquer um dos itens abaixo mudar, isso deve aparecer no handoff:

- `client/public/manifest.json`
- `client/index.html`
- favicon, logo ou ícones PWA
- rotas visuais principais
- textos institucionais da marca
- responsividade de login, sidebar e dashboard

## Definição de pronto antes do redeploy

A UI só deve ser considerada pronta para publicação quando:

- o visual estiver consolidado
- não houver edição pendente em arquivos de frontend principais
- o handoff estiver registrado
- o Codex tiver feito a validação técnica final

## Observação importante

Se o Gemini concluir a interface mas ainda existir ajuste fino de UI, o ideal é consolidar isso antes do redeploy. Evite publicar uma versão intermediária e depois redeployar novamente logo em seguida, salvo correção urgente.

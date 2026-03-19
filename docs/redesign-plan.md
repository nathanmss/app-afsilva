# Redesign Plan: AF Silva Transportes

## Diagnóstico Atual
A interface atual está "limpa", mas excessivamente simples ("flat"). Ela cumpre a função, mas falta o aspecto **robusto, corporativo e operacional** esperado para um sistema de logística e transportes. As cores são muito neutras e os componentes não têm profundidade.

## Estratégia de Redesign (UI/UX)
Para alinhar com a diretriz de "visual profissional, robusto, confiável, operacional, moderno e limpo":

1. **Paleta de Cores e Contraste:**
   - **Sidebar Escura (Dark Navy/Slate):** Transmite solidez e ajuda a separar claramente a navegação do conteúdo principal. É um padrão muito reconhecido em ERPs e painéis operacionais.
   - **Cores de Ação:** Uso de um azul forte (Primary) para ações principais e alertas visuais (Verde/Vermelho/Amarelo) bem definidos para status operacionais.
   - **Background:** Um fundo cinza muito claro (`bg-slate-50`) para dar destaque aos cards brancos, criando melhor percepção de profundidade.

2. **Tipografia e Hierarquia:**
   - Manter `Inter` e `Outfit`, mas dar mais peso aos títulos dos cards (headers) e criar divisões mais claras (borders).

3. **Componentes (Dashboard & Cards):**
   - Melhorar as sombras (`shadow-sm` para `shadow-md` em elementos de destaque).
   - Adicionar bordas sutis aos cards para definir bem os espaços.
   - Uso de cabeçalhos coloridos ou com separação nas tabelas e cards principais.
   - Estatísticas com ícones em fundos arredondados (accent circles) para chamar mais atenção.

4. **Navegação (Sidebar):**
   - Fundo escuro (`bg-slate-950`).
   - Links com ícones nítidos e um estado "ativo" que se destaca (ex: azul luminoso ou fundo translúcido com borda esquerda).
   - Logo mais integrada.

## Próximos Passos (Execução)
- [x] Atualizar `docs/redesign-plan.md`.
- [ ] Atualizar variáveis CSS (`index.css`) para injetar a nova paleta.
- [ ] Refatorar `Sidebar.tsx` para o novo modelo Dark/Robusto.
- [ ] Refatorar `Dashboard.tsx` para melhorar a apresentação visual dos indicadores (KPIs) e gráficos.
- [ ] Refatorar Layout e outros componentes menores para acompanhar o padrão.
- [ ] Registrar o handoff no `worklog.md`.

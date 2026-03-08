# Redesign Plan: AF Silva Transportes

## 1. Mapeamento de Telas Existentes
As seguintes telas compõem a estrutura atual da aplicação (previamente chamada "FleetMgr" ou "NextLog"):
- **Dashboard (`/`)**: Visão geral com KPIs (Total Income, Expenses, Net Balance) e gráficos de performance por veículo.
- **Finance (`/finance`)**: Gestão financeira (entradas/saídas).
- **Invoices (`/invoices`)**: Gerenciamento de faturas.
- **Loadings (`/loadings`)**: Gestão de cargas e fretes.
- **Vehicles (`/vehicles`)**: Cadastro e listagem de veículos da frota.
- **Employees (`/employees`)**: Gestão de motoristas e funcionários.
- **AuthPage (`/auth`)**: Tela de login/autenticação.

## 2. Gargalos de UX e Componentes Repetidos
- **Falta de Identidade Visual Própria**: O sistema atual usa o placeholder "FleetMgr" com um ícone genérico de caminhão. A identidade está baseada em tons de azul (`primary: 215 100% 50%`), mas sem personalização corporativa.
- **Navegação (Sidebar/Header)**: A sidebar e o header mobile estão funcionais, mas precisam refletir a marca de forma mais robusta e dar maior clareza visual.
- **Consistência de Tabelas e Formulários**: Mapeado uso intensivo de tabelas para listagens (veículos, funcionários, cargas, finanças). É necessário padronizar o layout, espaçamentos (padding/margin) e os estados de "vazio" e "carregando".
- **Microcopy**: Textos em inglês (e.g., "Overview for...", "Total Income"). Como é uma transportadora brasileira (AF Silva Transportes), deve-se avaliar a transição para PT-BR, embora o código possa ser mantido em inglês para o time técnico.

## 3. Direção Visual da Marca (AF Silva Transportes)
- **Aura / Sentimento**: Visual corporativo, profissional, robusto, moderno, confiável e limpo. Foco em logística e operação pesada.
- **Tipografia**: Manter a combinação atual de `Inter` (sans) para dados de tabela/sistema e `Outfit` (display) para títulos, mas reforçando os pesos (bold/semibold) para títulos das seções.
- **Cores**: 
  - Adequar a paleta primária (azul) para um tom mais profundo e corporativo (ex: azul marinho escuro), transmitindo solidez. 
  - Ajustar as cores de destaque e de status (verde/vermelho/amarelo) para garantir contraste adequado.
- **Componentes Base**: Utilizar os componentes do `shadcn/ui` já instalados (`Card`, `Button`, `Table`, `Badge`) mas reforçar o layout com maior densidade de informação sem criar poluição visual.

## 4. Estratégia de Rebranding
1. **Ativos da Marca**:
   - Trocar nome de "FleetMgr" para "AF Silva Transportes" em toda a UI (Sidebar, Headings, Titles).
   - Atualizar/substituir o logo e o favicon (`public/favicon.png`, `public/manifest.json`).
   - Alterar o `document.title` no `index.html`.
2. **Atualização da UI**:
   - Melhorar o componente `Sidebar` para comportar o nome completo ou um logo otimizado para o menu comprimido/mobile.
   - Revisar o `Dashboard` para dar um aspecto mais executivo aos KPIs (StatCards).
   - Padronizar os layouts internos (Finance, Invoices, Loadings, etc.) para garantir que tenham o mesmo cabeçalho, estilo de filtros e tabelas.
3. **Consistência de UX**:
   - Assegurar que os feedbacks de erro, loading (Skeletons já em uso) e sucesso estejam com a nova roupagem visual.

---
**Status:** Planejamento Finalizado. Partindo para a Etapa 3 (Rebranding).

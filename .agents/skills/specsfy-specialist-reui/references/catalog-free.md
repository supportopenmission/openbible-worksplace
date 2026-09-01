# Catálogo gratuito do ReUI

O catálogo público reúne componentes `c-*` e suas dependências públicas. Use o
registry para obter o nome e a API atual antes da instalação.

| Necessidade | Famílias gratuitas para pesquisar |
| --- | --- |
| Feedback | Alert, Badge, Rating, Timeline |
| Dados | Data Grid, Filters, Tree, Sortable |
| Formulários | Autocomplete, Cascader, Date Selector, File Upload, Number Field, Phone Input, Stepper |
| Planejamento | Event Calendar, Gantt, Kanban |
| Estrutura | Frame, Icon Stack, Icon Tile, Scrollspy |
| Navegação e ação | Button, Dialog, Sheet, Select, Navbar |

Também existem composições gratuitas de App Shell, Auth, Card, Chart,
Dashboard, Empty State, Form, List, Onboarding, Profile, Settings, Stats e
Wizard. Escolha por tarefa e estado da tela, não pela variedade do catálogo.

Os componentes internos mais extensos têm variantes Base UI e Radix UI. Use a
variante correspondente ao projeto.

## Mapa obrigatório para CRUDs

| Parte do CRUD | Primeiro recurso ReUI a consultar |
| --- | --- |
| Lista, ordenação, seleção, edição em linha e detalhe por clique na linha | Data Grid |
| Filtro simples ou composto | Filters |
| Criar e editar | Form, campos e Stepper quando houver etapas |
| Abrir ação sem sair da tela | Dialog ou Sheet |
| Remover, salvar e erro | Alert, Badge e estados do formulário |
| Anexos | File Upload |
| Escolhas remotas ou hierárquicas | Autocomplete, Cascader ou Tree |

Se a necessidade não aparecer nesse mapa, pesquise o catálogo antes de criar
um componente manual. O resultado final preserva o fluxo e as convenções do
sistema atual.

Para o Data Grid, escolha a variante que permita link de detalhe na linha inteira
com equivalente de teclado. Registre como ações internas, seleção e menus ficam
acima dessa área sem propagar a navegação.

O `Breadcrumb` pertence ao shell de toda tela. Em Laravel, procure o componente
shadcn/ui ou a composição existente no layout antes de instalar ou criar outro;
insira a equipe ativa, o módulo e a tela atual reaproveitando a API local.

Fonte: <https://reui.io/components>.

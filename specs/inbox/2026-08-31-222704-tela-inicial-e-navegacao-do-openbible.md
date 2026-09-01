# Inbox: Tela inicial e navegação do OpenBible

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-01T01:27:04Z |
| Slug | tela-inicial-e-navegacao-do-openbible |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `3bcfaa229b7a8290753f24614fcf9c6691228e6a1899f930fba976f55f21a72a` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

vamos a tela inicial usado o componente do shadnui (svelte-cn) item, e teremos tres opcoes iniciar: Ler a biblia e Montar um sermao e montar um estudo (em breve). e ao clicar vai para rotas: bible, sermons, and study. Teremos uma pagina de config aonde podemos definir qual é a tela inicial, para que ele possa abrir automaticamente na proxima vez que entrarmos no /. Crie um Sidebar que deve aparecer se o usuario tiver definido uma tela inicial, esse sidebar deve ser criado usando o componente do shadnui (svelte-cn).

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Criar uma tela inicial com três opções de entrada, rotas de Bíblia, sermões e estudo, configuração da tela inicial e sidebar condicional.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** A aplicação não oferece uma entrada de produto nem permite escolher uma tela para abrir automaticamente na rota /.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual do OpenBible.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** A pessoa escolhe iniciar lendo a Bíblia ou montando um sermão, identifica o estudo em breve e retoma diretamente sua área preferida nas próximas visitas.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Tela inicial; componente shadcn-svelte Item; três opções: Ler a Bíblia, Montar um sermão, Montar um estudo em breve; rotas /bible, /sermons e /study; página de configuração; preferência de tela inicial; sidebar condicional com shadcn-svelte.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Preferência persistente da tela inicial e estado necessário para decidir se o sidebar deve ser exibido.

### Riscos e dependências

**Análise preliminar:** A tecnologia shadcn-svelte ainda não está configurada no app; comportamento mobile do sidebar e rota exata da configuração precisam ser consolidados.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Criar shell de navegação reutilizável e páginas mínimas para as três rotas, preservando a possibilidade de evoluir cada módulo.

## Pontos a revisar no futuro

**A revisar:** Confirmar rota pública da configuração, comportamento quando nenhuma tela foi escolhida, persistência e visual dos estados mobile/desktop.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

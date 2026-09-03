# Inbox: Onboarding com abas de importacao, empty da Biblia, gestao e stats nas configuracoes

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-03T20:31:49Z |
| Slug | onboarding-com-abas-de-importacao-empty-da-biblia-gestao-e-stats-nas-configuracoes |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `cce018cc2c520ad7b6287bf1d89a151302a484e7f227cebdf1649bb01c0766d6` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

ajustes no onboarding: Add tabs para selecionar a forma de importacao (arquivos locais vs URL do bucket R2). Quando acessamos a bible sem nenhuma versao instalada, melhore a interface usando o empty do shadcn e mostre colocando os botoes para importar as biblias. Nas configuracoes add tab para gerenciar as biblias instaladas e as opcoes de excluir as versoes. Nas configuracoes precisamos de uma aba para mostrar stats de arquivos, notas, sermons e biblias.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Abas de importação no onboarding, empty shadcn na Bíblia vazia, aba de gerenciar/excluir Bíblias e aba de stats no /config.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Importação sem escolha clara de método; Bíblia vazia com CTA simples; sem gestão/exclusão de versões; sem visão de uso do workspace.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual do OpenBible

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Escolher como importar, ver estado vazio orientado, gerenciar e excluir Bíblias, e ver stats do workspace.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Tabs local/R2 no onboarding; Empty shadcn com botões; aba Bíblias com excluir; aba stats com contagens

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Versões em bibles/; notas e sermões Markdown; contagens e tamanhos para stats

### Riscos e dependências

**Análise preliminar:** Empty shadcn indisponível localmente; exclusão irreversível; contagem de arquivos grandes

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Backlog de experiência de importação/gestão/stats

## Pontos a revisar no futuro

**A revisar:** Componente Empty via CLI shadcn ou próprio; confirmação de exclusão; métricas exatas do stats

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

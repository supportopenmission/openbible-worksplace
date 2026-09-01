# Inbox: Leitor da Bíblia com SQLite importado

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-01T04:38:35Z |
| Slug | leitor-da-biblia-com-sqlite-importado |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `6844a671c68c15acb84b0f11fee792ac2fe7dfa426958f6a791729db3164325b` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

usando o specsfy e mcp ai-memory implemente a funcionalidade do leitor de bablia, se inpire em https://openbible-prod.vercel.app/ e ai ideia é consumir o sqlites importadas

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Implementar um leitor bíblico local que consuma os bancos SQLite importados.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** A rota da Bíblia ainda é apenas uma superfície reservada e não permite consultar os textos importados.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual do OpenBible.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Ler capítulos de Bíblias importadas localmente em uma interface focada, sem depender de servidor.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Leitor na rota /bible; inspiração visual na referência publicada; consumo dos arquivos SQLite já importados.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Consultar arquivos em bibles/ e manter somente a seleção local necessária para retomar a leitura.

### Riscos e dependências

**Análise preliminar:** Variações do schema OpenLP; arquivos ausentes ou inválidos; dependência de execução SQLite no navegador.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Listar versões, selecionar livro e capítulo, navegar entre capítulos e buscar texto.

## Pontos a revisar no futuro

**A revisar:** Escopo posterior de destaques, notas, comparação de versões, download por URL e sincronização.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

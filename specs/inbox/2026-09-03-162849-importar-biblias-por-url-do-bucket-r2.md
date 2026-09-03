# Inbox: Importar biblias por URL do bucket R2

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-03T19:28:49Z |
| Slug | importar-biblias-por-url-do-bucket-r2 |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `4d00f0b1456910efbec00a9ad98883d3601886ba9e7f23cfe32e3ed234c22e3c` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

precisamos usando o specsfy implementar uma funcionalidade que podemos passar uma url do bucket do R2 que contem as biblias, e ele vai baixar os arquivos sqlite e importar as biblias. Fluxo: Colocar a url mostra os arquivos sqls disponiveis para importar, mostrar o progresso de cada arquivo de download e instalar as versoes.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Permitir informar URL do bucket R2 para listar SQLite disponíveis e importar com progresso por arquivo.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Hoje só há importação local por arrastar e soltar; falta distribuição remota das Bíblias via URL R2.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual do OpenBible

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Instalar versões bíblicas remotas informando apenas a URL base do bucket.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** URL base R2; listagem de .sqlite disponíveis; progresso por arquivo; instalação de versões; validação OpenLP; bibles/

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** URL base informada talvez precise ser guardada; arquivos SQLite em bibles/; catálogo de versões instaladas

### Riscos e dependências

**Análise preliminar:** CORS do bucket; formato da listagem; arquivos grandes; validação de SQLite remoto

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Backlog de importação remota R2 com listagem, download com progresso e instalação

## Pontos a revisar no futuro

**A revisar:** Formato exato da URL e da listagem; autenticação; comportamento offline; onde a tela vive (onboarding, /bible, /config)

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

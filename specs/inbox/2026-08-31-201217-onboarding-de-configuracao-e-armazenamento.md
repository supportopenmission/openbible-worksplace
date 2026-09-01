# Inbox: Onboarding de configuração e armazenamento

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-31T23:12:17Z |
| Slug | onboarding-de-configuracao-e-armazenamento |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `e7494115d7cc725fdad8fa3bbb67c42eccba7bb75f8b32626f4ca9dabfcb1704` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

vamos implementar a primeira feature do projeto, seguindo o fluxo do specsfy. O que preciso: Vamos fazer o onboarding de configuração. O onboarding irá configurar os arquivos do app. O usuario deve selecionar.a pasta aonde ficará salvo os dados se ele tiver no desktop (localhost ou tauri) ele seleciona pasta (user o folder dialog do sistema) , se for no web pwa ele vai salvar no OPFS. estrutura da pasta de exemplo seria algo como: OpenBible/.openbible/config.json, index.sqlite, sync.json, bibles/ara.sqlite, nvi.sqlite, kjv.sqlite, notes/theology/justification.md, notes/theology/sanctification.md, notes/studies/romans-8.md, notes/studies/john-3.md, sermons/drafts/jesus-esta-voltando.md, sermons/preached, sermons/series/volta-de-cristo/01-sinais.md, 02-vigilancia.md, 03-volta.md, studies/characters, studies/themes, studies/books, templates/sermon.md, study.md, note.md, attachments/images, audio, pdf, files, trash. Como o app usar Files over app seguiremos essa estrutura. O que vemos na tela: Vai abrir um modal de onboarding. Mostrando algumas informaçoes do app explicando basicamente como funciona. Ao avançar o usuario seleciona a pasta aonde será configurado os arquivos, quando ele selecionar a pasta e confirmar a instalacao, o app cria as pastas e arquivos necessários. (precisa mostrar a barra de progresso da configuracao) depois ele pergunta ao usuario se ele deseja importar as biblias sqlites, se ele clicar para importar mostra o campo para arrastar os arquivos ou ao clicar abrir o dialog file. e vai copiar os arquivos para a pasta do arquivos do app. Se ele dizer que vai fazer depois deixar como pendente e vai para / do projeto.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Criar onboarding para escolher ou preparar o armazenamento do OpenBible e opcionalmente importar Bíblias SQLite.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** O aplicativo ainda não orienta a pessoa a configurar o diretório de dados nem oferece um caminho inicial para importar Bíblias.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** A pessoa usuária individual do OpenBible em localhost, PWA ou futuro desktop Tauri.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Ao concluir o onboarding, a estrutura Files over app está criada no armazenamento adequado, com progresso visível, e a pessoa pode importar Bíblias agora ou deixar essa etapa pendente.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Modal de onboarding; seleção de pasta por diálogo do sistema em localhost/Tauri; OPFS no PWA; estrutura OpenBible/.openbible, bibles, notes, sermons, studies, templates, attachments e trash; arquivos JSON/SQLite; criação com barra de progresso; importação por arrastar/soltar ou diálogo de arquivos; cópia para bibles; importação pode ficar pendente; seguir para a rota inicial do projeto.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Local escolhido ou armazenamento OPFS; status da configuração; config.json; sync.json; index.sqlite; arquivos SQLite importados e seus nomes; status pendente da importação bíblica.

### Riscos e dependências

**Análise preliminar:** Compatibilidade entre localhost, PWA e Tauri; permissões de diretório; APIs de sistema e OPFS; falhas parciais de criação/cópia; arquivos inválidos, duplicados ou grandes; necessidade de uma base SQLite válida.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Definir contrato de armazenamento por ambiente; criar estrutura idempotente; apresentar progresso e recuperação de erro; importar SQLite por seleção e drag-and-drop; permitir continuar sem importar.

## Pontos a revisar no futuro

**A revisar:** Definir a plataforma efetivamente entregue nesta primeira feature; conteúdo inicial dos arquivos JSON e validade/schema de index.sqlite; critérios para arquivos SQLite inválidos, duplicados e falhas parciais; rota inicial após concluir ou pular; limites de tamanho e acessibilidade do modal e upload.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

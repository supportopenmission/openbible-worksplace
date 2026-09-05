# Inbox: Arquitetura local-first, interoperabilidade, sincronização e agentes de IA

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-05T19:20:57Z |
| Slug | arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `5088f9e53865f698fcd6cbb4f730ab88254c3e413739a6d6a4c47d8858f36f30` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Eu quero que você analise o projeto, porque é o seguinte: o Open Bible, ele segue a metodologia, a filosofia de files over apps. Então todos os dados precisam estar salvos localmente. E aí o que acontece? A gente tem o PWA, que pra funcionar no mobile, por exemplo, é web, e um nativo que roda usando Tauri. Então o Tauri já usa o motor nativo, então uma conexão SQL direta, a leitura da pasta do sistema onde fica salvo os arquivos. O PWA usa o OPFS, porque no iOS, por exemplo, acho que ele não tem suporte à pasta direto do sistema, mas você pode verificar se tem ou não, mas eu acredito que não tenha. Por isso a gente tá usando o OPFS. E o SQLite a gente tá usando via o WASM, W-A-S-M, pra poder fazer essa conexão. Até verifica se é isso que tá acontecendo pra mim ter uma noção. Mas o que eu queria que você me ajudasse? Nós temos a feature de notas, tá? Essa feature de notas a gente utiliza Markdown. A gente tá usando o Markdown, porque a gente já tem Svelte. A gente tá usando o Markdown com editor e ele escreve no arquivo Markdown. Só que ele usa, por exemplo, o Fence pra poder colocar ali o verso bíblico, um bloco de verso bíblico e tal, o iframe de YouTube e tal, assim por diante. E eu queria ver se esse formato ele continua sendo legível. Porque, por exemplo, qual que é a ideia que eu penso? Eu queria que esse Markdown que é gerado fosse compatível 100% com Obsidian, com GitHub Pages, por exemplo, ou GitHub repositórios. De forma que a gente consiga pegar as notas e o sermão e assim e poder colocar num repositório no Obsidian, assim por diante. Também a gente exportar isso pra poder gerar um PDF, por exemplo, da nota da pregação, assim por diante. E eu queria saber se esse jeito que a gente tá fazendo cobre essa compatibilidade, entende? E se não, como que a gente poderia, por exemplo? A gente tem um bloco de versículo bíblico no editor, que a gente coloca ali o slash command, ali do editor, você seleciona o bloco de versículo, aí seleciona a referência, e aí ele abre, ele adiciona o bloco de versículo. E aí, como eu falei, ele tá usando Fence, ali aquele que é dois pontos dois pontos dois pontos e uma descrição ali. Ele usa isso. Eu não sei se a gente usaria, seria melhor usar um callout, por exemplo, ou um code block, por exemplo, ou existe uma outra forma que a gente consiga fazer isso e referenciar de forma que, se eu mudar, clicando ali eu possa mudar a referência, né? Porque às vezes, imagina, eu tô escrevendo a nota, eu criei um bloco de versículo, só que depois eu preciso mudar a versão dele ou mudar o próprio texto. Então como ele é um bloco, a ideia seria que eu pudesse editar isso e depois ele vai renderizar em Markdown com o texto bíblico. Mas aí eu não sei se tá entendendo a ideia que eu tô falando. É porque eu quero que o produto final seja um Markdown, mas seja um Markdown compatível com Obsidian, com GitHub Pages, com editores de Markdown. De forma que a gente consiga ler essas informações. Consegue verificar pra mim? Temos a gente tem um iframe também, então não sei, ele também usa o Fence. Não sei se o ideal seria usar um iframe ali, porque o Obsidian reconhece o iframe, sabe? Faz essa pesquisa pra mim, analisa pra mim essa estrutura toda.

Show de bola. Uma outra coisa importante pra você, é o seguinte: hoje a gente utiliza SQLite pra poder fazer índices, algumas informações, né? Eu já nem sei exatamente todas as informações que são salvas no SQLite, mas de uma forma que seja fácil a transferência disso. Você acha que um JSON ou um XML seria uma possibilidade de ser usado? Ou não? Ou SQLite é o mais ideal? Porque assim, qual que é a ideia? A ideia é que a gente vai ter depois a integração com o Auto Merge, por exemplo, pra poder fazer a sincronia entre aparelhos, né? E a ideia é que os dados fiquem, tipo, do cidade, fiquem na máquina do usuário. O OpenMap é apenas uma casca, sabe? É uma ferramenta, mas se a pessoa quiser parar de usar, os dados ficam ausentes, né? Eu até tava pensando em fazer um servidorzinho, tipo interno, mas assim, funcionaria bem pro Tauri, por exemplo, que tá na máquina, né? Faz uma API que zera o front-end. Porém, no PWA mobile não funcionaria bem, né? Porque não tem como tá rodando uma... eu não sei se o Service Worker seria capaz de funcionar dessa forma, sabe?

openmap nao, o correto openbible

Uma outra coisa interessante é que futuramente a ideia é a gente também ter um agente de IA, por exemplo, que a gente consiga ter algumas informações complementares. Então, e aí a ideia é que a pessoa vai conectar ali a API Key, por exemplo, e vai poder usar os agentes dentro da aplicação. O aplicativo desktop normalmente é o main driver da aplicação. Mas como eu não tenho a licença de desenvolvedor ainda na Apple, por exemplo, eu não consigo lançar uma versão aplicativo nativo, que seria muito interessante para mobile. Mas por isso que eu tô usando PWA, entendeu?

usando o specsfy add isso na inbox para seguirmos as implementando

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Evoluir o OpenBible como aplicação Files Over Apps, mantendo conteúdo local, portátil e interoperável entre desktop Tauri e PWA, com sincronização futura e agentes de IA.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** O formato atual precisa conciliar Markdown interoperável, dados estruturados transferíveis, índices SQLite, limitações do OPFS e do Service Worker, sincronização entre aparelhos e execução futura de agentes de IA sem prender os dados ao aplicativo.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoas usuárias do OpenBible que criam notas, sermões, estudos e destaques no desktop ou no mobile e desejam manter a posse e a portabilidade dos próprios dados.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Permitir que o conteúdo continue legível e utilizável fora do OpenBible, seja sincronizado com segurança entre dispositivos e possa alimentar recursos de IA sem transformar o aplicativo ou um servidor em fonte exclusiva dos dados.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Declarações: filosofia Files Over Apps; dados locais; desktop Tauri como main driver; PWA como alternativa mobile; OPFS no PWA; SQLite/WASM; notas em Markdown; blocos editáveis de versículo e vídeo; compatibilidade desejada com Obsidian, GitHub Pages, repositórios Markdown e PDF; futura sincronização com Automerge; futura conexão de API key para agentes de IA. Inferências da análise: separar arquivos autorais portáveis, índices locais reconstruíveis e estado técnico de sincronização; evitar servidor HTTP local como requisito comum às plataformas.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Notas, sermões e estudos em Markdown/YAML; referências e snapshots de versículos; vídeos e respectivos metadados; destaques bíblicos; configurações do workspace; preferências por dispositivo; arquivos SQLite de Bíblias; índice SQLite reconstruível; identificadores estáveis; versões de schema; estado e histórico de sincronização; anexos; configurações de provedores de IA; credenciais secretas mantidas fora do workspace e da sincronização; possíveis conversas, resultados aceitos, embeddings e índices de IA.

### Riscos e dependências

**Análise preliminar:** Compatibilidade parcial dos fences atuais com renderizadores Markdown; perda de dados autorais se destaques permanecerem apenas no SQLite auxiliar; conflitos ao sincronizar arquivos SQLite binários; OPFS não ser uma pasta visível e poder ser removido com os dados do site; Service Worker não funcionar como backend permanente; suporte desigual de sincronização em background; duplicidade de fonte da verdade entre arquivos e Automerge; exposição de API keys no ambiente web; dependência temporária do PWA enquanto não houver distribuição nativa iOS.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Refinar uma arquitetura com Markdown/CommonMark ou GFM portátil para conteúdo; metadados discretos e fallback legível para blocos especiais; JSON para dados autorais estruturados; SQLite somente para Bíblias importadas e índices reconstruíveis; migração de reader_highlight para formato portátil; Workspace Core compartilhado com adaptadores Tauri IPC e PWA Worker/OPFS; Automerge como mecanismo de merge e sincronização sem sincronizar index.sqlite; exportação e restauração completas do OPFS; agentes de IA consumindo o Workspace Core com alterações revisáveis; armazenamento seguro e local de credenciais por dispositivo.

## Pontos a revisar no futuro

**A revisar:** Definir o formato canônico dos blocos de versículo e vídeo; decidir granularidade dos documentos e arquivos JSON; definir quais preferências sincronizam; decidir estratégia de reconciliação entre edições externas e Automerge; escolher transporte, autenticação e eventual criptografia ponta a ponta da sincronização; definir política de exportação, backup e recuperação do PWA; definir modelo de permissão dos agentes, persistência de conversas e dados enviados a provedores; avaliar distribuição nativa iOS quando houver licença.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

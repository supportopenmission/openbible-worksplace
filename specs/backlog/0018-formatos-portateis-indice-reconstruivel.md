# Backlog: Formatos portáteis e índice reconstruível

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0018 |
| Status | Ready for specification |
| Produto | OpenBible |
| Épico | Arquitetura local-first e portabilidade dos dados |
| Funcionalidade | Markdown autoral portátil e índice local reconstruível |
| Tipo | Funcionalidade |
| Prioridade | Alta — preservação e saída dos dados do usuário |
| Milestones | |
| Criado em | 2026-09-05 |
| Spec promovida | Nenhuma |

## Ideia original

Tornar Markdown e JSON os formatos autorais portáteis do OpenBible e manter o SQLite do workspace somente como índice reconstruível. O conteúdo deve continuar legível sem o OpenBible, em editores Markdown, Obsidian, repositórios GitHub, GitHub Pages e exportações para PDF.

## Problema percebido

Fences e extensões próprias têm compatibilidade parcial fora do OpenBible. Um verso bíblico ou vídeo pode deixar de ser legível em outro editor, e os destaques autorais hoje podem depender do índice SQLite. Se o índice for perdido ou corrompido, o conteúdo autoral não pode desaparecer nem depender do aplicativo para ser lido.

## Pessoa afetada ou beneficiada

Pessoa usuária que escreve notas, sermões e estudos e quer abrir, versionar, compartilhar, publicar, sincronizar ou converter esse conteúdo sem ficar presa ao OpenBible. Também beneficia implementações futuras de backup, Automerge, agentes de IA e novos leitores do workspace.

## Resultado ou valor esperado

Notas e metadados autorais são arquivos Markdown/JSON humanos, portáveis e content-preserving. Blocos de verso e vídeo têm uma representação visível em Markdown padrão e metadados ocultos versionados para edição rica no OpenBible. Destaques ficam em arquivos JSON com IDs estáveis. O índice SQLite pode ser removido e reconstruído deterministicamente a partir do conteúdo, sem impedir a leitura e a edição autoral.

## Contexto

Segunda fatia do BACKLOG-0016. Depende da identidade e do isolamento de workspace definidos na primeira fatia, e deve estabelecer o contrato persistente antes de backup, sincronização Automerge e agentes de IA. O contrato canônico é deliberadamente menor que qualquer renderização enriquecida: compatibilidade significa leitura e preservação de conteúdo, não igualdade visual entre todos os editores.

## Referências relacionadas

- `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — épico pai e decomposição.
- `specs/backlog/0017-multiplos-workspaces-modelo-vaults.md` — identidade e isolamento do workspace que contém os arquivos.
- `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md` — SPEC-0016; deve estar Planned/Plan Gate antes desta fatia entrar em implementação.
- `specs/in-progress/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/spec.md` e `specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md` — contrato atual do editor, fences, índice, embeds e exportação.
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md` e `specs/completed/0006-lista-highlights-indicador-nota-leitor/spec.md` — persistência atual dos destaques.
- CommonMark — especificação da sintaxe Markdown comum: https://spec.commonmark.org/current/
- GitHub Flavored Markdown — extensão documentada pelo GitHub: https://github.github.com/gfm/
- Obsidian — sintaxe Markdown suportada: https://help.obsidian.md/syntax
- RFC 8259 — JSON interoperável: https://www.rfc-editor.org/rfc/rfc8259
- SQLite — documentação oficial sobre o banco: https://www.sqlite.org/docs.html

## Comportamento esperado

- Cada nota canônica é um arquivo Markdown UTF-8 com frontmatter YAML simples e compatível, usando campos escalares para identidade e classificação. O frontmatter inclui ID estável da nota, tipo e versão do schema; chaves desconhecidas são preservadas ao editar e salvar.
- O Markdown canônico usa apenas construções amplamente legíveis como títulos, parágrafos, listas, blockquotes, links e tabelas GFM. `:::`, callouts de Obsidian, wiki-links, `iframe` e elementos HTML próprios não são a única representação visível de nenhum conteúdo.
- Um bloco de verso canônico mostra um blockquote comum com título, referência, versão e snapshot do texto. Comentários HTML padrão, com JSON compacto versionado, carregam o ID estável, referência, versão e dados necessários para o editor rico. O OpenBible edita referência/versão e regenera o snapshot; divergência manual detectada no texto é preservada e reportada, nunca sobrescrita silenciosamente.
- Se os comentários de metadados do verso forem removidos, o blockquote permanece legível como texto comum, mas o OpenBible informa que os recursos de edição rica e a referência estruturada foram degradados.
- Um vídeo canônico é um link Markdown comum com título visível, provedor e URL. Um comentário HTML padrão carrega JSON versionado e ID estável. O OpenBible pode melhorar o clique para carregar o player, mas o arquivo canônico não contém `iframe`.
- Exportações derivadas para Obsidian ou Jekyll/GitHub Pages podem gerar callout ou `iframe` quando isso for suportado pelo alvo, sempre a partir do arquivo canônico, com aviso de que o resultado não é a fonte autoral e não deve substituir o arquivo original.
- A impressão/PDF não depende de rede: exibe fallback com título, referência, texto do verso e título/URL do vídeo. Falha de carregamento remoto nunca remove conteúdo do documento.
- A importação reconhece `:::verse` e `:::video` legados, renderiza seu conteúdo sem perda e migra blocos válidos para o envelope canônico somente em um salvamento explícito e atômico. Fences inválidos permanecem texto literal visível e são sinalizados.
- As extensões legadas `==texto==` e `++texto++` recebem fallback Markdown visível ou migração que preserve o texto. A paridade visual/semântica da extensão não é prometida fora do OpenBible.
- `.openbible/index.sqlite` é um índice local, descartável e versionado. Uma reconstrução percorre Markdown e JSON canônicos, aplica regras determinísticas e produz o mesmo resultado para a mesma entrada, sem tratar o índice como fonte autoral.
- O aplicativo abre, lê e edita conteúdo autoral quando o índice está ausente, corrompido ou em versão incompatível; pode recriá-lo no dispositivo sem pedir uma restauração externa.
- Destaques do leitor são gravados em `highlights/<highlightId>.json`, um registro autoral por arquivo, com ID estável e referências necessárias. `reader_highlight` passa a ser apenas projeção no índice.
- Os arquivos SQLite das Bíblias importadas permanecem fontes de conteúdo imutáveis e não são confundidos com o índice reconstruível do workspace.
- IDs de notas, blocos e destaques são estáveis e independentes de caminho físico, permitindo mover a pasta e preparar sincronização futura.
- JSON é o formato de sidecar estruturado; XML fica fora do escopo. O contrato deve ser natural para TypeScript, SQLite/WASM e Automerge.
- A promessa de compatibilidade é leitura e preservação de conteúdo em editor simples, Obsidian, renderer do GitHub e GitHub Pages. Pixel-identidade de widgets enriquecidos não faz parte do contrato.

## Regras de negócio

- O arquivo Markdown/JSON autoral é a fonte da verdade; índice, cache, renderização enriquecida e PDF são derivados.
- O envelope canônico só pode ocultar metadados complementares; a perda desses comentários não pode tornar o conteúdo visível ilegível.
- Cada bloco canônico tem ID estável e tipo/versionamento explícitos. IDs não podem ser derivados exclusivamente do caminho, posição ou texto atual.
- Ao alterar referência ou versão pelo editor, o OpenBible atualiza os metadados e o snapshot de forma transacional. Texto editado externamente que divergir do snapshot deve gerar estado de conflito/aviso e permanecer disponível para decisão da pessoa.
- O OpenBible não reescreve automaticamente um arquivo só por abri-lo. Migração de legacy fences ocorre em salvamento explícito e deve ser atômica.
- Fences inválidos ou desconhecidos não podem ser descartados durante importação; devem permanecer literais e ser reportados como não migrados.
- O canonical Markdown não usa `iframe`, callout, wiki-link, `:::`, HTML customizado ou outra extensão como único conteúdo visível.
- Um link de vídeo permanece válido mesmo sem JavaScript, rede ou suporte a embed. O player é uma melhoria opcional.
- PDF e visualização offline não podem depender de uma requisição de rede para mostrar o fallback do vídeo ou verso.
- O índice pode ser excluído e reconstruído sem alterar os arquivos autorais. Falha de reconstrução não autoriza apagar ou corrigir silenciosamente a fonte.
- Cada destaque autoral ocupa exatamente um arquivo JSON por ID, facilitando diff, cópia seletiva e merge futuro.
- `reader_highlight` não recebe escrita autoral independente após a migração; é projeção derivada e pode ser regenerado.
- Bíblias SQLite importadas não são reserializadas como Markdown/JSON e não entram na rotina de reconstrução do índice.
- Sidecars estruturados usam JSON versionado e preservam chaves desconhecidas quando são regravados; XML não é formato aceito para essa fatia.

## Critérios de aceitação

- **AC-001 — Frontmatter portátil:** Dado uma nota com ID, tipo, versão de schema e chaves YAML desconhecidas, quando ela é aberta e salva pelo OpenBible, então permanece UTF-8, usa frontmatter escalar legível e preserva todas as chaves desconhecidas e seus valores compatíveis.
- **AC-002 — Verso legível sem o app:** Dado um bloco de verso criado no editor, quando o arquivo é aberto em um leitor CommonMark/GFM sem plugins, então título, referência, versão e snapshot aparecem em um blockquote visível, mesmo que os comentários HTML sejam ignorados.
- **AC-003 — Edição rica do verso:** Dado um envelope de verso válido com ID estável, quando a pessoa altera referência ou versão no bloco, então o OpenBible atualiza metadados e snapshot sem trocar o ID nem alterar silenciosamente texto externo divergente; a divergência fica preservada e sinalizada.
- **AC-004 — Degradação segura do verso:** Dado um blockquote cujo comentário de metadados foi removido, quando a nota é aberta, então o conteúdo continua legível, o bloco não é apagado e a interface informa a perda da edição rica/referência estruturada.
- **AC-005 — Vídeo portátil:** Dado um vídeo inserido, quando o Markdown canônico é renderizado no GitHub, GitHub Pages, Obsidian ou editor simples, então existe um título e link/URL visíveis e não há `iframe` necessário para compreender o conteúdo.
- **AC-006 — Player derivado e PDF offline:** Dado um vídeo canônico, quando a pessoa usa o OpenBible com ou sem rede ou exporta/imprime PDF, então o app pode carregar um player somente como melhoria e sempre mantém título/URL visíveis sem depender da rede.
- **AC-007 — Migração explícita de fences:** Dado um `:::verse` ou `:::video` válido, quando a pessoa abre a nota e apenas lê, então o conteúdo não é reescrito; quando salva explicitamente, então é migrado atomicamente para o envelope canônico sem perda visível. Fence inválido permanece literal.
- **AC-008 — Fallback das extensões:** Dado texto legado com `==...==` ou `++...++`, quando ele é importado ou exportado para um alvo Markdown comum, então o texto permanece visível por fallback/migração e qualquer perda semântica é informada, sem alegar paridade visual completa.
- **AC-009 — Índice ausente ou corrompido:** Dado um workspace sem `.openbible/index.sqlite` ou com índice inválido, quando a pessoa inicia o OpenBible, então o conteúdo autoral continua abrindo para leitura/edição e o sistema oferece ou executa reconstrução determinística sem apagar arquivos.
- **AC-010 — Reconstrução determinística:** Dado o mesmo conjunto de Markdown e JSON canônicos, quando o índice é reconstruído duas vezes em dispositivos ou momentos diferentes, então as entradas derivadas, IDs e relações observáveis são equivalentes e a versão do índice é registrada.
- **AC-011 — Destaque autoral granular:** Dado um destaque criado, quando ele é salvo, movido junto com o workspace ou sincronizado futuramente, então existe exatamente um `highlights/<highlightId>.json` com ID independente do caminho, e `reader_highlight` pode ser recriado como projeção.
- **AC-012 — Bíblias imutáveis:** Dado um arquivo SQLite de Bíblia importada, quando o índice do workspace é apagado e reconstruído, então o arquivo de Bíblia não é tratado como índice, não é modificado e continua disponível como fonte importada.
- **AC-013 — JSON sobre XML:** Dado um sidecar estruturado de nota/bloco/destaque, quando ele é criado ou regravado, então usa JSON versionado, é consumível por TypeScript/WASM e preserva chaves desconhecidas; nenhum XML novo é exigido ou produzido.
- **AC-014 — IDs portáveis e promessa documentada:** Dado que a raiz do workspace muda de caminho ou é aberta em outro leitor, quando notas, blocos e destaques são lidos, então seus IDs não dependem do caminho e a documentação/exportação identifica a compatibilidade como content-preserving, sem prometer pixel-identidade.

## Qualidades e operação

- Segurança: o parser trata frontmatter, comentários e fences como dados, limita tamanho/profundidade razoáveis e não executa HTML, JavaScript ou URL de vídeo ao indexar. Exportação derivada deve escapar conteúdo e preservar o link original.
- Privacidade: conteúdo autoral, snapshots, destaques e sidecars permanecem locais por padrão; o índice não cria cópia sem necessidade e futuras integrações devem escolher explicitamente o que enviar.
- Integridade: migração de bloco e reconstrução do índice usam escrita atômica, arquivo temporário e recuperação diante de falha; a fonte autoral nunca é substituída por uma projeção incompleta.
- Desempenho: abertura de nota não precisa varrer o workspace inteiro; reconstrução percorre somente raízes do workspace ativo e pode informar progresso. O índice é otimização, não pré-requisito de leitura.
- Determinismo: mesma entrada canônica, schema e versão de parser geram a mesma projeção, ordenação e relações, independentemente do dispositivo.
- Interoperabilidade: o caminho feliz usa CommonMark/GFM, YAML escalar compatível, links e blockquotes; recursos específicos do OpenBible ficam em comentários e exportações derivadas.
- Acessibilidade: referências, títulos, links e estados de degradação/conflito são expostos em texto; o editor não comunica um bloco apenas por cor, iframe ou ícone.
- Auditoria local: migração, degradação, conflito de snapshot, falha de índice e reconstrução registram estado e versão sem registrar conteúdo completo ou caminhos sensíveis em logs desnecessários.

## Dependências

- `SPEC-0016` — Múltiplos workspaces no modelo de vaults; deve estar em Planned/Plan Gate antes da implementação desta fatia, pois define raiz ativa e isolamento.
- `BACKLOG-0017` / sua spec promovida — catálogo e identidade de workspace.
- `specs/in-progress/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/spec.md` — editor Milkdown/Svelte e compatibilidade atual.
- `specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md` — bloco bíblico, embed, índice e PDF existentes.
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md` e `specs/completed/0006-lista-highlights-indicador-nota-leitor/spec.md` — leitura e persistência atuais de destaques.
- Adaptadores de storage do workspace (Tauri, File System Access e OPFS) definidos na fatia de workspaces.
- Parser/serializer Markdown já usado pelo editor e runtime SQLite/WASM existente.

## Situações de erro

- Frontmatter inválido ou não escalar: abrir o corpo Markdown como texto legível, preservar o original e mostrar diagnóstico; não substituir por valores inventados.
- Chave desconhecida ou valor não serializável: preservar a representação original quando possível e impedir uma gravação destrutiva até a pessoa revisar.
- Comentário JSON ausente, inválido ou incompatível: renderizar fallback visível, marcar o bloco como degradado e manter o texto.
- Snapshot divergente do texto externo: preservar as duas evidências, informar conflito e exigir decisão antes de regenerar.
- Fence legacy incompleto/desconhecido: manter literal, sinalizar não migrado e continuar processando o restante da nota.
- Migração atômica interrompida: restaurar o arquivo anterior ou deixar o temporário identificável para recuperação; nunca deixar Markdown truncado como fonte única.
- Link de vídeo inválido, provedor desconhecido ou rede indisponível: mostrar título/URL, sem bloquear leitura, impressão ou PDF.
- Índice ausente, corrompido ou em schema incompatível: abrir conteúdo, marcar índice indisponível e reconstruir em versão suportada; não apagar autoral.
- JSON de destaque inválido ou duplicado: manter arquivos originais, excluir somente a entrada inválida da projeção e apresentar relatório para correção manual.
- Colisão de ID em arquivos movidos/copied: não mesclar silenciosamente; reportar o ID e oferecer resolução preservando a fonte.
- Falha de permissão/armazenamento durante reconstrução: parar sem alterar a fonte e oferecer nova tentativa quando a raiz estiver disponível.

## Escopo

- Dentro: contrato de Markdown canônico; frontmatter compatível; envelopes de verso e vídeo; comentários JSON versionados; importação e migração explícita de fences; fallback das extensões `==`/`++`; links e PDF offline; JSON sidecars de destaques; IDs portáveis; separação entre índice e conteúdo; SQLite index versionado e reconstruível; testes de parser, round-trip, migração e reconstrução.
- Fora: criação/seleção de múltiplos workspaces (BACKLOG-0017); backup ZIP e restauração completa (0019); transporte remoto e resolução de Automerge (0020); agente de IA, credenciais, embeddings e política de rede (0021); promessa de renderização pixel-idêntica; converter Bíblias SQLite importadas para Markdown/JSON; XML; renomear fisicamente a pasta; implementação de novos provedores bíblicos ou de vídeo.

## Dúvidas, decisões e riscos

- **Decisão D-001 — Canonical Portable Markdown v1:** usar CommonMark/GFM com frontmatter YAML escalar/compatível. Chaves desconhecidas devem sobreviver ao round-trip. Fonte: conversa atual e requisitos de interoperabilidade.
- **Decisão D-002 — Legibilidade independente:** o Markdown armazenado deve ser humano-legível sem OpenBible. Nenhum `:::`, callout, wiki-link, `iframe` ou elemento HTML customizado pode ser a única representação visível.
- **Decisão D-003 — Envelope de verso:** blockquote padrão visível com título/referência/versão/snapshot, envolvido por comentários HTML padrão contendo JSON compacto versionado, ID estável e metadados. O app regera o snapshot ao editar referência/versão; divergência externa é preservada e reportada.
- **Decisão D-004 — Envelope de vídeo:** link Markdown visível com título/provedor/URL e comentário JSON oculto. Player é enhancement do app; canonical e exportação GitHub não usam iframe. Exportações derivadas podem usar callout/iframe somente com aviso.
- **Decisão D-005 — Legacy:** `:::verse`/`:::video` válidos migram somente em salvamento explícito e atômico; inválidos permanecem literais. `==`/`++` precisam de fallback visível ou migração com aviso de downgrade.
- **Decisão D-006 — Índice:** `.openbible/index.sqlite` é descartável, versionado, local ao dispositivo e reconstruído deterministicamente a partir de Markdown/JSON. A aplicação funciona com índice ausente/corrompido.
- **Decisão D-007 — Destaques:** `highlights/<highlightId>.json` é a fonte autoral, um registro por arquivo; `reader_highlight` é projeção. Bíblias SQLite importadas são fontes imutáveis, não índices.
- **Decisão D-008 — Estruturados:** JSON é preferido a XML por compatibilidade com TypeScript, WASM e Automerge; XML está fora do escopo.
- **Decisão D-009 — Identidade:** IDs de nota/bloco/destaque são estáveis e independentes do caminho. Frontmatter inclui ID, tipo e versão de schema; chaves desconhecidas são preservadas.
- **Decisão D-010 — Compatibilidade:** compromisso público é legibilidade e preservação de conteúdo em editores simples, Obsidian, GitHub renderer e GitHub Pages; pixel-identidade de widgets não é garantida.
- **Risco R-001:** diferentes parsers podem interpretar YAML/HTML comments de modo distinto. Mitigação: restringir o perfil v1 a campos escalares, sintaxe padrão e fixtures cross-renderer no TDD.
- **Risco R-002:** regenerar snapshot após edição externa pode destruir intenção autoral. Mitigação: hash/estado de divergência, preservação do texto e confirmação explícita.
- **Risco R-003:** reconstruções grandes podem bloquear o PWA. Mitigação: varredura incremental/progressiva e índice descartável, sem bloquear leitura.
- **Risco R-004:** duplicação de IDs em cópias manuais dificulta sync. Mitigação: detectar colisão, não mesclar silenciosamente e manter IDs no conteúdo, não no caminho.
- **Risco R-005:** PDF/Obsidian/GitHub não possuem paridade de widgets. Mitigação: fallback visível e documentação explícita de content-preserving.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.
- [x] O perfil canônico de Markdown, envelopes de verso/vídeo e política de degradação estão definidos.
- [x] A fonte autoral, o índice reconstruível, os destaques JSON e as Bíblias SQLite imutáveis estão separados.
- [x] Há critérios para editor simples, Obsidian, GitHub/GitHub Pages e PDF sem rede.

## Próximo passo

Promover para `$specsfy-03-specify` somente após `SPEC-0016` alcançar Planned/Plan Gate; não iniciar `$specsfy-07-implement` nesta conversa.

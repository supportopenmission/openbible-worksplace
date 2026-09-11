# Backlog: Armazenamento e gerenciamento de mídias no editor Edra

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0023 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Notas e armazenamento local |
| Funcionalidade | Persistência e gerenciamento de mídias das notas |
| Tipo | Épico |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-10 |
| Spec promovida | `specs/defined/0022-armazenamento-gerenciamento-midias-editor-edra/spec.md` |

## Ideia original

No editor edra precisamos trabalhar em coisa, os blocks de imagens, video, audio eles quebram ao inserir uma imagem quando tentamos fazer o upload, precisamos ver como podemos salvar isso no pwa e no desktop tauri, eu acho que no desktop podemos usar o .openbible que fica na pasta do usuario. mas se vc tiver outra ideia. e ai precisaremos tbm de ter nas configuracoes em uso e armazenamento uma opcao de gerenciar as midias, que iremos implementar uma pagina que mostra todas os arquivos usafos nas notas.

## Problema percebido

Blocos de imagem, vídeo e áudio quebram ao inserir mídia por upload no editor Edra, e o produto ainda não possui um contrato definido para persistir nem gerenciar esses arquivos entre PWA e desktop Tauri.

## Pessoa afetada ou beneficiada

Pessoa usuária individual que cria e edita notas no editor Edra em PWA ou desktop Tauri.

## Resultado ou valor esperado

Inserir e reabrir mídias das notas de forma confiável em cada plataforma e disponibilizar uma área em Configurações > Uso e armazenamento para listar e gerenciar os arquivos utilizados.

## Contexto

Evolução do editor Edra e da infraestrutura de workspace local. Complementa o shell Tauri e workspace nativo de BACKLOG-0014, a gestão/estatísticas de armazenamento de BACKLOG-0009 e os blocos de vídeo do editor de BACKLOG-0015, mas adiciona o ciclo de vida de arquivos de imagem, vídeo e áudio vinculados às notas.

## Referências relacionadas

- `specs/inbox/2026-09-10-125413-armazenamento-e-gerenciamento-de-midias-no-editor-edra.md` — origem da captura.
- `specs/backlog/0014-versao-nativa-macos-tauri.md` — backlog relacionado: workspace nativo e runtime Tauri.
- `specs/backlog/0009-importacao-com-abas-empty-da-biblia-gestao-e-stats.md` — backlog relacionado: uso e armazenamento nas configurações.
- `specs/backlog/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export.md` — backlog relacionado: bloco de vídeo no editor de notas.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` — spec relacionada: contrato atual de notas e workspace local.
- `.specsfy/DATABASE.md` — dados confirmados: metadados de mídia, vínculos com notas e ciclo de vida sem uso.
- `apps/web/src/lib/features/config/ConfigPage.svelte` e `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — documentação relacionada: superfície atual de Configurações > Uso e armazenamento.
- `INTERFACE.md` e `DESIGNSYSTEM.MD` — documentação relacionada: shell, estados e padrões de listagem da interface.
- `apps/web/src/lib/features/notes/` — documentação relacionada: componentes e serviços atuais do editor.
- `apps/web/src/lib/storage/` — documentação relacionada: adaptadores de persistência existentes.

## Comportamento esperado

- Quando a pessoa envia uma imagem, vídeo ou áudio no editor Edra, o arquivo é copiado para o workspace local da plataforma e a nota mantém uma referência por identificador estável.
- A mídia copiada pode ser reaberta offline no PWA e no desktop Tauri, sem depender da localização original do arquivo enviado.
- A área de Configurações > Uso e armazenamento deverá listar as mídias do workspace com tipo, tamanho, quantidade de notas que as usam, última utilização e filtros por tipo.
- A pessoa poderá excluir mídias sem uso; mídias referenciadas por notas serão bloqueadas e mostrarão as notas relacionadas.
- O MVP aceitará PNG, JPEG, WebP e GIF para imagens; MP4 e WebM para vídeos; MP3, M4A e OGG para áudios, sem transcodificação.
- Os limites iniciais serão 10 MB por imagem, 50 MB por áudio e 200 MB por vídeo.
- No PWA, a mídia e seu catálogo serão persistidos em IndexedDB; no Tauri, os metadados ficarão no `app.sqlite` e os bytes em uma pasta `media/` do workspace nativo.
- O editor validará e copiará a mídia antes de inserir o bloco; uma falha não salvará bloco quebrado nem mídia órfã.
- Backups e restaurações locais incluirão os arquivos de mídia e seu catálogo; sincronização entre dispositivos ficará fora desta fatia.
- Quando uma mídia estiver ausente, corrompida ou não restaurada, o bloco permanecerá na nota com um placeholder acessível e ação de retry/reimportação, sem impedir a abertura da nota.

## Regras de negócio

- Upload de mídia cria uma cópia gerenciada pelo workspace; a nota não depende do caminho original do arquivo.
- A referência salva na nota usa um identificador estável da mídia, separado da localização física específica de cada plataforma.
- A exclusão de uma mídia usada por uma ou mais notas deve ser bloqueada e explicar quais notas ainda possuem a referência.

## Critérios de aceitação

- **AC-001 — Upload persistente:** Dado um arquivo de imagem, vídeo ou áudio em formato e tamanho aceitos, quando a pessoa conclui o upload no editor Edra, então o arquivo é copiado para o workspace, o catálogo recebe seus metadados e o bloco é inserido com uma referência estável.
- **AC-002 — Reabertura offline:** Dado um bloco de mídia persistido, quando a pessoa reabre a nota sem rede no PWA ou no desktop Tauri, então a mídia é carregada a partir do backend local da plataforma.
- **AC-003 — Validação:** Dado arquivo com formato não aceito ou acima do limite da categoria, quando a pessoa tenta enviar, então o editor informa o erro, não insere o bloco e não deixa arquivo órfão.
- **AC-004 — Falha de cópia:** Dado erro de quota, permissão, interrupção ou escrita, quando a cópia não termina, então o bloco não é inserido, o catálogo não mantém referência inválida e a pessoa recebe uma ação recuperável.
- **AC-005 — Inventário:** Dado o acesso a Configurações > Uso e armazenamento, quando existem mídias no workspace, então a tela lista nome, tipo, formato, tamanho, última utilização, estado e quantidade de notas relacionadas, com filtro por tipo.
- **AC-006 — Mídia sem uso:** Dado uma mídia sem vínculos ativos, quando a pessoa a consulta no inventário, então ela permanece listada como sem uso e pode ser apagada por ação explícita.
- **AC-007 — Proteção de referências:** Dado uma mídia usada por uma ou mais notas, quando a pessoa tenta apagá-la, então a ação é bloqueada, as notas relacionadas são indicadas e o arquivo permanece disponível.
- **AC-008 — Mídia ausente:** Dado uma nota com mídia ausente, corrompida ou não restaurada, quando a pessoa abre a nota, então a nota abre com placeholder acessível e ação de retry/reimportação.
- **AC-009 — Backup e restauração:** Dado um workspace com mídias, quando a pessoa cria e restaura um backup local, então os arquivos, metadados e vínculos são incluídos e reabertos sem referências quebradas.
- **AC-010 — Plataformas:** Dado o PWA ou o desktop Tauri, quando a pessoa usa os mesmos fluxos de upload, leitura, inventário e exclusão, então cada runtime usa seu backend operacional sem expor um caminho físico arbitrário à interface.

## Qualidades e operação

- Segurança: validar o tipo real e a extensão, limitar caminhos ao workspace nativo, impedir exclusão de mídia referenciada e não aceitar caminhos arbitrários vindos da interface.
- Privacidade: arquivos e metadados permanecem no workspace local; sincronização entre dispositivos e envio a servidor ficam fora desta fatia.
- Desempenho e volume: sem transcodificação; limites de 10 MB por imagem, 50 MB por áudio e 200 MB por vídeo; upload sinaliza progresso e operações não carregam mídias inteiras para a listagem quando apenas metadados bastarem.
- Durabilidade: cópia do arquivo e registro da referência devem deixar estado recuperável; falha parcial não pode produzir bloco ou catálogo apontando para mídia inexistente.
- Acessibilidade: inventário, filtros, estados vazio/loading/erro/sucesso, placeholder e ações de retry/exclusão são operáveis por teclado, têm foco visível e mensagens semânticas; a tela funciona em mobile e desktop sem overflow.

## Dependências

- Adaptadores de armazenamento do PWA e do desktop Tauri.
- Blocos de imagem, vídeo e áudio do editor Edra.
- Área de Configurações > Uso e armazenamento.
- Serialização canônica das notas e referências estáveis de blocos.
- Backup e restauração do workspace.
- Registro persistente de mídia confirmado em `.specsfy/DATABASE.md`.

## Situações de erro

- Formato ou tamanho inválido: informar o motivo e manter o editor sem bloco novo.
- Quota, permissão ou interrupção durante a cópia: limpar estado parcial e oferecer retry.
- Mídia ausente ou corrompida: manter a nota editável, mostrar placeholder e oferecer reimportação.
- Exclusão de mídia em uso: bloquear, listar as notas relacionadas e preservar o arquivo.
- Workspace indisponível: desabilitar ações de mídia e oferecer o fluxo de recuperação existente.
- Backup incompleto ou restauração sem o arquivo: preservar o vínculo e marcar a mídia como ausente, sem bloquear a abertura da nota.

## Escopo

- Dentro: upload validado de imagens, vídeos e áudios no editor Edra; persistência local no PWA e Tauri; referências estáveis; catálogo de metadados e vínculos; inventário em Configurações > Uso e armazenamento; filtros por tipo; exclusão manual de mídias sem uso; bloqueio de exclusão em uso; placeholders e reimportação; inclusão em backup/restauração; testes de unidade, integração e navegador necessários.
- Fora: sincronização entre dispositivos; upload ou leitura remota; transcodificação; remoção automática de mídias sem uso; renomear, substituir ou processamento em lote; redesign do editor fora dos blocos de mídia; usar `.openbible` como backend operacional.

## Dúvidas, decisões e riscos

- **Decisão da descoberta — Pergunta 1:** mídias enviadas serão copiadas para o workspace; as notas guardarão um identificador estável para permitir uso offline e gerenciamento local. Fonte: resposta do usuário em 2026-09-10.
- **Decisão da descoberta — Pergunta 2:** a exclusão de uma mídia em uso será bloqueada, com indicação das notas que ainda a referenciam. Fonte: resposta do usuário em 2026-09-10.
- **Decisão da descoberta — Pergunta 3:** o MVP terá inventário seguro com tipo, tamanho, quantidade de notas, última utilização, filtros e exclusão apenas de mídias sem uso. Fonte: resposta do usuário em 2026-09-10.
- **Decisão da descoberta — Pergunta 4:** o MVP aceitará formatos comuns sem transcodificação, com limites de 10 MB por imagem, 50 MB por áudio e 200 MB por vídeo. Fonte: resposta do usuário em 2026-09-10.
- **Decisão da descoberta — Pergunta 5:** usar os backends operacionais atuais: IndexedDB no PWA; `app.sqlite` para metadados e pasta `media/` no workspace nativo Tauri para os bytes. `.openbible` não será backend ativo de mídia. Fonte: resposta do usuário em 2026-09-10.
- **Decisão da descoberta — Pergunta 6:** validar e copiar antes de inserir o bloco; falhas não deixam bloco quebrado nem arquivo órfão. Fonte: resposta do usuário em 2026-09-10, entrada `111` normalizada como opção 1.
- **Decisão da descoberta — Pergunta 7:** incluir mídias em backup e restauração local; sincronização entre dispositivos fica fora desta fatia. Fonte: resposta do usuário em 2026-09-10.
- **Decisão da descoberta — Pergunta 8:** manter o bloco com placeholder acessível e recuperação por retry/reimportação quando a mídia estiver ausente, corrompida ou não restaurada; a nota continua abrindo. Fonte: resposta do usuário em 2026-09-10.
- **Descoberta de dados — Pergunta 1:** cada mídia guarda nome original, tipo, formato, tamanho, data de importação, última utilização, identificador estável, estado e vínculos com todas as notas; quantidade de notas e uso podem ser derivados. Fonte: `.specsfy/DATABASE.md`, confirmado em 2026-09-10.
- **Descoberta de dados — Pergunta 2:** ao perder a última referência, a mídia permanece como sem uso até exclusão manual; não há remoção automática. Fonte: `.specsfy/DATABASE.md`, confirmado em 2026-09-10.
- **Decisões técnicas ainda necessárias na especificação:** serialização exata da referência no conteúdo canônico da nota; algoritmo/namespace do identificador; atomicidade entre bytes e metadados; formato do catálogo no IndexedDB e migration do `app.sqlite`; contrato Tauri para leitura/escrita; integração do manifesto de backup; detecção de corrupção; conteúdo e ação do retry/reimportação.
- **Riscos:** arquivos grandes e quota do PWA; permissões do workspace Tauri; restauração parcial; referências antigas ou externas; divergência entre o bloco Edra e o catálogo.

## Pronto para especificação

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Pronto para `$specsfy-03-specify`; as decisões técnicas abertas devem ser fechadas na spec sem alterar as decisões de produto registradas acima.

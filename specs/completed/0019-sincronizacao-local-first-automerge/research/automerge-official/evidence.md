# Evidência oficial do Automerge

Consultas realizadas em 2026-09-05 e 2026-09-07. Estas são notas próprias; não reproduzem
trechos extensos das fontes.

## Repositories e adapters

Fonte: [Automerge Repositories](https://automerge.org/docs/reference/repositories/),
documentação oficial consultada em 2026-09-05.

O `Repo` recebe um `StorageAdapter` para persistência local e zero ou mais
`NetworkAdapter`s para comunicação com peers. Mudanças locais e recebidas são
salvas pelo adapter anexado. Impacto: o OpenBible deve manter o estado de
replicação separado do banco operacional de notas e definir adapters por
backend, sem exigir rede para abrir um workspace.

## Protocolo por documento e independente do transporte

Fonte: [Automerge Concepts](https://automerge.org/docs/reference/concepts/),
documentação oficial consultada em 2026-09-05.

O protocolo de sync é transport-agnostic e opera por documento; o repository
coordena vários documentos e adapters. Impacto: o vínculo deve usar IDs
estáveis por documento e `workspaceId`, não um único documento gigante nem o
banco bruto de notas.

## Persistência local no navegador e banco nativo

Fonte: [Automerge Storage](https://automerge.org/docs/reference/repositories/storage/),
documentação oficial consultada em 2026-09-05.

Há adapters oficiais para IndexedDB e adapters próprios podem usar um
key/value store com range queries. O OpenBible deve persistir estado CRDT e
notas por meio do contrato local: IndexedDB no PWA e `app.sqlite` no Tauri;
filesystem, OPFS e `.openbible/index.sqlite` ficam restritos a migração,
exportação ou recovery explícitos.

## Offline e reconexão

Fonte: [Automerge Network Sync](https://automerge.org/docs/tutorial/network-sync/),
documentação oficial consultada em 2026-09-05.

Com storage local, o cliente pode criar e alterar documentos sem conexão; ao
retornar a rede, as mudanças locais sincronizam com peers remotos. Impacto:
indisponibilidade do relay não pode bloquear leitura ou edição local.

## Relay público e produção

Fonte: [Automerge Network Sync](https://automerge.org/docs/tutorial/network-sync/),
mesma consulta oficial.

O servidor público comunitário é indicado para prototipagem e não oferece
garantias de confiabilidade ou segurança de dados; produção deve operar relay
próprio. Impacto: endpoint configurável e opt-in, sem tratar relay como fonte
exclusiva ou backup.

## Servidor de demonstração

Fonte: [automerge-repo-sync-server README](https://github.com/automerge/automerge-repo-sync-server/blob/main/README.md),
repositório oficial consultado em 2026-09-05.

O servidor de exemplo é um Express sem segurança embutida. Impacto: a spec não
deve prometer autenticação pronta; exige TLS, autenticação/política de acesso e
operação própria antes de uso produtivo.

## Adapter oficial e API HTTP própria

Fonte: [Automerge Networking](https://automerge.org/docs/reference/repositories/networking/)
e [Network Sync](https://automerge.org/docs/tutorial/network-sync/), documentação
oficial consultada em 2026-09-07.

O adapter remoto documentado para o `automerge-repo` é o
`WebSocketClientAdapter`, pareado com `WebSocketServerAdapter`; o servidor de
referência usa Express, WebSocket e `DATA_DIR`. A API HTTPS incremental do
OpenBible, por outro lado, é um transporte próprio de registros, revisões,
cursores e conflitos: ela não implementa o protocolo de mensagens do
Automerge. Impacto: HTTP é a opção operacional simples para sync em foreground;
WebSocket permanece o caminho separado para aproveitar a convergência CRDT
oficial em uma etapa futura.

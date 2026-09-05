# Evidência oficial do Automerge

Consulta realizada em 2026-09-05. Estas são notas próprias; não reproduzem
trechos extensos das fontes.

## Repositories e adapters

Fonte: [Automerge Repositories](https://automerge.org/docs/reference/repositories/),
documentação oficial consultada em 2026-09-05.

O `Repo` recebe um `StorageAdapter` para persistência local e zero ou mais
`NetworkAdapter`s para comunicação com peers. Mudanças locais e recebidas são
salvas pelo adapter anexado. Impacto: o OpenBible deve manter a fonte autoral
fora do estado CRDT e definir adapters por backend, sem exigir rede para abrir
um workspace.

## Protocolo por documento e independente do transporte

Fonte: [Automerge Concepts](https://automerge.org/docs/reference/concepts/),
documentação oficial consultada em 2026-09-05.

O protocolo de sync é transport-agnostic e opera por documento; o repository
coordena vários documentos e adapters. Impacto: o vínculo deve usar IDs estáveis
por unidade autoral, não um único documento gigante nem o SQLite de índice.

## Persistência local no navegador e filesystem

Fonte: [Automerge Storage](https://automerge.org/docs/reference/repositories/storage/),
documentação oficial consultada em 2026-09-05.

Há adapters oficiais para IndexedDB e filesystem Node; adapters próprios podem
usar qualquer key/value store com range queries. Sem `StorageAdapter`, o repo é
transitório. Impacto: PWA e Tauri podem compartilhar o contrato e diferir na
persistência; o estado CRDT local precisa sobreviver a reinício.

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

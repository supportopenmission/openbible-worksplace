# Evidência de pesquisa — backup e restauração PWA

Consulta realizada em 2026-09-05. Este arquivo contém notas próprias e links
para fontes oficiais; não reproduz documentação protegida.

## OPFS e File System Access API

- Fonte: MDN, [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system), atualizado em 2025-07-14, licenciado sob CC BY-SA conforme a própria página.
- Locators: seção `Origin private file system`; parágrafos sobre armazenamento privado da origem, quota, `navigator.storage.estimate()`, limpeza do site e iteração assíncrona de diretórios.
- Observação: OPFS é privado da origem, não aparece como pasta do usuário, sofre limites de quota e é removido quando os dados do site são limpos. O backup precisa, portanto, produzir um arquivo baixável e não depender de localizar a raiz OPFS fora do navegador.
- Fonte: MDN, [`showDirectoryPicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker), consultado em 2026-09-05.
- Locators: `Limited availability`, `Secure context`, `Transient user activation`, exceções `AbortError` e `SecurityError`.
- Observação: o seletor de pasta é capacidade opcional do navegador, exige HTTPS e gesto da pessoa. A restauração deve ter fallback por arquivo e nunca prometer pasta visível em plataformas sem essa API.

## Fluxo e compressão

- Fonte: MDN, [Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API), consultado em 2026-09-05.
- Locators: descrição da API e interfaces `CompressionStream`/`DecompressionStream`.
- Observação: a API nativa expõe streams `gzip` e `deflate`; ela não define um contêiner de múltiplas entradas. O pacote desta spec usa ZIP interoperável, com um adaptador de ZIP streaming; `CompressionStream` pode ser usado dentro do adaptador quando disponível, mas não é o contrato do pacote.
- Fonte: PKWARE, [APPNOTE.TXT — ZIP File Format Specification](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT), versão 6.3.10 consultada em 2026-09-05.
- Locators: seção 4.1.1 (assinaturas internas e extensões), 4.1.3 (compressão opcional; método Deflate 8 comum), seção 4.4 (registros e central directory), seção 4.5.3/4.5.4 (ZIP64 quando os limites do formato clássico não bastam).
- Observação: o pacote adota ZIP/ZIP64, UTF-8 nos nomes, Deflate quando o adaptador oferecer e armazenamento sem compressão como fallback. A integridade autoral é definida pelo manifesto SHA-256, não pelo CRC do contêiner.
- Fonte: MDN, [`SubtleCrypto.digest()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest), atualizado em 2025-12-28 e consultado em 2026-09-05.
- Locators: nota de compatibilidade imediatamente antes de `Syntax`, informando que a operação recebe a mensagem inteira e não suporta entrada streaming.
- Observação: WebCrypto serve apenas para entradas que já cabem no limite de memória. Arquivos maiores exigem um hasher SHA-256 incremental encapsulado (JS/WASM no PWA ou bridge nativa), sem acumular o arquivo inteiro.

## Service Worker

- Fonte: MDN, [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), consultado em 2026-09-05.
- Locators: seções `Service Worker API` e `Service worker concepts and usage`.
- Observação: service workers são workers orientados a eventos, intermediários de rede/cache e sem DOM. Eles não formam um processo de servidor local persistente; backup/restauração permanece um caso de uso iniciado pela página e apoiado pelos adaptadores de storage.

## Inspeção local do projeto

- `apps/web/src/lib/storage/types.ts` expõe `WorkspaceStorage` com leitura,
  escrita, existência, exclusão e listagem simples.
- `apps/web/src/lib/storage/opfs-storage.ts` e `local-storage.ts` percorrem
  `FileSystemDirectoryHandle`; `tauri-storage.ts` usa bridge tipada para a
  pasta nativa.
- `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` já é a
  superfície de Configurações que informa backend, persistência e ações de
  storage; `ConfigPage.svelte` compõe sua seção responsiva.

## Impacto normativo

1. O arquivo exportado tem extensão `.openbible-backup.zip`, MIME `application/vnd.openbible.backup+zip` e deve ser reconhecido pelas assinaturas ZIP internas.
2. A raiz ZIP contém apenas `openbible-backup.json` e `files/<caminho-relativo>`; o manifesto não é compactado e fica no primeiro registro para permitir validação progressiva.
3. A versão inicial do contrato é `format: "openbible-backup"`, `formatVersion: 1`, `container: "zip"`; entradas que ultrapassarem os limites clássicos usam ZIP64.
4. O contêiner e a interface do navegador são detalhes de adaptação. O arquivo portátil e o manifesto continuam independentes de OPFS, handles, catálogo local e service worker.
5. SHA-256 sem assinatura detecta corrupção ou divergência entre manifesto e entrada, mas não autentica a origem contra alguém capaz de recalcular o manifesto. A interface e a spec não devem chamá-lo de assinatura digital.

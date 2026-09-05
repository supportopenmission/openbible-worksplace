# Backlog: Backup e restauração do workspace PWA

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0019 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Arquitetura local-first e portabilidade dos dados |
| Funcionalidade | Backup e restauração verificáveis entre backends de armazenamento |
| Tipo | Funcionalidade |
| Prioridade | Alta — recuperação e posse dos dados locais |
| Milestones | |
| Criado em | 2026-09-05 |
| Spec promovida | `specs/planned/0018-backup-restauracao-workspace-pwa/spec.md` |

## Ideia original

Oferecer exportação e restauração completas do workspace mantido em OPFS, preservando Markdown, JSON, Bíblias e anexos.

## Problema percebido

O OPFS é privado da origem e não oferece a mesma visibilidade e posse operacional de uma pasta nativa. Limpar os dados do navegador, trocar de aparelho ou perder a origem pode tornar o conteúdo local inacessível se não houver uma cópia portátil verificável. O backup também não pode capturar referências específicas do dispositivo como catálogo, handles, `localStorage` ou cache do service worker.

## Pessoa afetada ou beneficiada

Pessoa usuária individual do PWA, especialmente em mobile/iOS, que precisa retirar seus dados do navegador, recuperar um workspace, transferi-lo entre OPFS, pasta selecionada pelo navegador e pasta nativa do Tauri, ou manter uma cópia independente antes de uma operação de risco.

## Resultado ou valor esperado

Gerar um pacote portátil versionado, verificável e restaurável sem depender da permanência dos dados do navegador. A restauração deve criar um workspace novo por padrão, preservar conteúdo autoral e anexos, permitir Bíblias por escolha explícita e reconstruir projeções locais sem transformar o aplicativo ou o índice em fonte da verdade.

## Contexto

Terceira fatia dependente do BACKLOG-0016; usa a identidade, o isolamento e a barreira de autosave definidos pela fatia de workspaces, além do contrato de Markdown/JSON e índice reconstruível do BACKLOG-0018. O pacote precisa funcionar entre OPFS, File System Access e Tauri sem transportar caminhos, handles ou referências privadas do dispositivo.

## Referências relacionadas

- `specs/backlog/0016-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — épico pai e decomposição.
- `specs/planned/0016-multiplos-workspaces-modelo-vaults/spec.md` — identidade ativa, barreira de troca, catálogo local e exclusão de referências do dispositivo.
- `specs/backlog/0017-multiplos-workspaces-modelo-vaults.md` — identidade portátil e separação entre catálogo local e raiz do workspace.
- `specs/backlog/0018-formatos-portateis-indice-reconstruivel.md` — Markdown/JSON autorais, destaques em sidecars e `.openbible/index.sqlite` reconstruível.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — OPFS, File System Access e importação atual.
- `specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md` — exportação e conteúdo mantidos pelo editor atual.
- `apps/web/src/lib/storage/types.ts`, `apps/web/src/lib/storage/opfs-storage.ts`, `apps/web/src/lib/storage/tauri-storage.ts` e `apps/web/src/lib/features/workspace/WorkspaceSettings.svelte` — fronteiras atuais de storage e configuração observadas no repositório.
- MDN — OPFS é privado da origem e não equivale a uma pasta visível do usuário: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- MDN — File System Access API tem suporte limitado e depende de gesto/HTTPS: https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
- MDN — service workers são orientados a eventos e não são um servidor local persistente: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

## Comportamento esperado

- A pessoa acessa a área de armazenamento existente em `ConfigPage`/`WorkspaceSettings` e encontra as ações `Criar backup` e `Restaurar backup`. O fluxo informa o workspace ativo, o tamanho estimado, a última gravação e o que ficará de fora.
- Antes de enumerar arquivos, o OpenBible espera a barreira de autosave do workspace ativo. Enquanto o snapshot estiver em andamento, gravações concorrentes ficam aguardando ou são rejeitadas explicitamente; se o flush falhar ou a geração mudar, o backup não é declarado concluído e pode ser repetido sem produzir um pacote apresentado como válido.
- O backup enumera recursivamente a raiz autoral do workspace por um iterador assíncrono e inclui Markdown, JSON, anexos e arquivos autorais desconhecidos que não pertençam a uma área operacional reservada. Caminhos são normalizados como relativos à raiz, usando `/` e codificação UTF-8.
- O pacote portátil usa uma extensão identificável, um manifesto `openbible-backup.json` versionado e uma área de arquivos. O manifesto registra formato, versão, `workspaceId` de origem, nome exibido, data, backend de origem, política de Bíblias, contagem, tamanho total e uma entrada por arquivo com caminho relativo, tamanho, tipo e SHA-256. Não registra caminho absoluto, handle, chave OPFS, catálogo local ou segredo.
- A fonte portátil `.openbible/config.json` pode acompanhar o pacote somente com campos de identidade e formato. Referências locais, caminhos, permissões e marcadores transitórios são removidos ou recriados no destino conforme o contrato de workspace.
- `.openbible/index.sqlite` nunca entra no pacote de conteúdo; ele é uma projeção descartável e será recriado no destino conforme o BACKLOG-0018. Catálogo local de workspaces, handles File System Access, referências OPFS, `localStorage`, IndexedDB do shell, Cache Storage/cache do service worker, locks, temporários e logs operacionais também ficam fora.
- As fontes SQLite de Bíblias ficam fora por padrão para manter o pacote menor e evitar cópia implícita de conteúdo importado. A pessoa pode marcar `Incluir Bíblias importadas`; a confirmação mostra tamanho, arquivos, hashes e que a restauração tratará esses SQLite como fontes imutáveis, sem reserializá-los como dados autorais.
- A geração e a leitura usam streaming/iteradores e buffers limitados. Nenhum arquivo autoral nem o pacote inteiro precisa ser carregado na memória; a implementação deve manter buffers ativos de no máximo 16 MiB, respeitar quota disponível e interromper de forma recuperável quando o destino não suportar a operação.
- A restauração valida o manifesto, a versão, os limites, os caminhos, as duplicatas, os tipos e os checksums antes de apresentar sucesso. Caminhos absolutos, `..`, separadores inconsistentes, nomes reservados, entradas duplicadas, colisões após normalização/case-folding, links simbólicos e arquivos especiais são rejeitados de forma segura.
- A restauração grava primeiro em uma área de staging privada do backend escolhido. O commit só ocorre depois da enumeração, validação e verificação dos checksums; falha de leitura, quota, permissão ou checksum remove o staging ou deixa um marcador recuperável, sem apagar nem truncar um workspace existente.
- O destino padrão é um workspace novo e isolado. Quando o `workspaceId` de origem já existe no catálogo local, a cópia recebe um novo ID e mantém uma referência não operacional à origem no relatório; nunca ficam duas raízes ativas com o mesmo ID. Restaurar a identidade original ou direcionar para um workspace existente exige uma ação explícita e validação adicional.
- Arquivos com mesmo caminho e conteúdo idêntico podem ser deduplicados apenas quando o fluxo explícito permitir. Arquivos diferentes no mesmo caminho geram conflito reportável e não são sobrescritos silenciosamente; a operação permanece em staging até a resolução ou cancelamento.
- Após o commit autoral, o destino pode abrir mesmo que a reconstrução do índice falhe. O sistema marca a projeção como indisponível, oferece nova tentativa e não remove os arquivos restaurados.
- A conclusão exibe relatório com arquivos incluídos, omitidos, Bíblias, conflitos, checksums e motivo de qualquer exclusão. O relatório não expõe conteúdo completo nem caminhos sensíveis em logs compartilháveis.

## Regras de negócio

- O conteúdo Markdown/JSON, anexos e fontes explicitamente incluídas são a fonte portátil; o app, o catálogo do aparelho, caches e o índice SQLite são derivados ou operacionais.
- Um backup só pode ser anunciado como válido após o autosave, a enumeração completa, a criação do manifesto e a verificação dos checksums.
- A lista de exclusões é normativa: catálogo local, handles, referências OPFS, `localStorage`, IndexedDB do shell, Cache Storage/service worker, locks/temporários/logs e `.openbible/index.sqlite` não podem ser reintroduzidos por padrão.
- Cada entrada do manifesto possui caminho relativo único e checksum SHA-256. A normalização é aplicada antes da checagem de duplicatas, inclusive em sistemas sem diferenciação de maiúsculas e minúsculas.
- Conteúdo do pacote é tratado como dado. Restaurar não executa HTML, JavaScript, arquivos ou comandos encontrados no conteúdo.
- O pacote recebido não altera o workspace ativo nem o catálogo local até o commit. A criação do destino e o cadastro no catálogo acontecem somente após staging válido.
- O modo seguro de restauração é `novo workspace`. Substituição, mescla e preservação do ID de origem exigem ação explícita, com conflito visível, e não podem contornar a regra de ID único.
- Bíblias incluídas continuam imutáveis e podem ser omitidas, copiadas ou deduplicadas por hash conforme a política exibida; não podem sobrescrever silenciosamente uma fonte diferente.
- Falha em qualquer etapa preserva o último workspace funcional e permite tentar novamente, escolher outro destino ou cancelar.

## Critérios de aceitação

- **AC-001 — Snapshot consistente:** Dado um workspace com gravações pendentes, quando a pessoa inicia um backup, então o OpenBible conclui o autosave antes da enumeração, impede escrita concorrente incompatível e só produz sucesso para uma geração estável.
- **AC-002 — Enumeração completa:** Dado um workspace OPFS com Markdown, JSON, anexos e subpastas, quando o backup é criado, então cada arquivo autoral permitido aparece recursivamente no manifesto com caminho relativo, tamanho e checksum.
- **AC-003 — Pacote portátil:** Dado um backup criado em OPFS, quando ele é aberto em um destino File System Access ou Tauri, então o manifesto e os arquivos não dependem de caminho absoluto, handle, referência OPFS ou catálogo do dispositivo.
- **AC-004 — Exclusões operacionais:** Dado um workspace com `.openbible/index.sqlite` e estado operacional no dispositivo, quando o backup é criado, então o pacote exclui índice, catálogo, handles, `localStorage`, IndexedDB do shell, Cache Storage/service worker, locks, temporários e logs, mantendo conteúdo autoral.
- **AC-005 — Política de Bíblias:** Dado um workspace com fontes SQLite de Bíblias, quando a pessoa cria backup sem marcar a opção, então elas ficam omitidas e o relatório informa isso; quando marca a opção, então entram com tamanho/hash e política explícita de restauração imutável.
- **AC-006 — Manifesto verificável:** Dado um pacote com manifesto válido, quando qualquer arquivo é alterado, truncado ou removido, então a restauração detecta a divergência por tamanho/checksum e não faz commit parcial.
- **AC-007 — Streaming limitado:** Dado um arquivo maior que a memória disponível, quando o backup ou a restauração é executado, então a operação usa leitura/escrita em fluxo com buffers ativos de até 16 MiB, sem criar uma cópia integral do workspace em memória.
- **AC-008 — Validação de caminho:** Dado um pacote com caminho absoluto, `..`, duplicata normalizada, colisão de case-folding, link simbólico ou tipo especial, quando a restauração é validada, então a entrada é rejeitada antes de escrever dados no destino.
- **AC-009 — Staging e rollback:** Dado um erro de quota, permissão, leitura ou checksum durante a restauração, quando a operação falha, então o staging é removido ou sinalizado para recuperação, o workspace existente permanece intacto e a pessoa recebe uma ação de nova tentativa/cancelamento.
- **AC-010 — Novo workspace seguro:** Dado um backup válido cuja identidade de origem já está no catálogo, quando a pessoa restaura usando a opção padrão, então é criado um workspace independente com novo ID, sem substituir o ativo nem manter IDs duplicados.
- **AC-011 — Conflitos explícitos:** Dado um destino existente e um arquivo restaurado com caminho igual, quando os conteúdos diferem, então a restauração relata o conflito e não sobrescreve silenciosamente; conteúdo idêntico só é deduplicado por regra explícita.
- **AC-012 — Reconstrução do índice:** Dado um pacote restaurado sem `.openbible/index.sqlite`, quando o novo workspace é aberto, então o conteúdo autoral fica disponível e o índice é reconstruído ou marcado para nova tentativa sem bloquear a leitura.
- **AC-013 — Falha do índice não destrói autoral:** Dado um erro durante a reconstrução pós-commit, quando a pessoa abre o workspace restaurado, então Markdown, JSON e anexos permanecem intactos e a interface informa a projeção indisponível.
- **AC-014 — Relatório e privacidade:** Dado um backup concluído ou rejeitado, quando a pessoa consulta o resultado, então vê contagens, tamanho, Bíblias, exclusões, conflitos e checksums relevantes sem que logs ou relatório revelem segredos ou conteúdo completo.

## Qualidades e operação

- Integridade: manifesto versionado, checksum SHA-256, escrita em staging e commit/rollback impedem sucesso enganoso e truncamento da fonte.
- Segurança: validação de caminhos e tipos rejeita traversal, absolutos, duplicatas, colisões, symlinks, arquivos especiais e arquivos de operação; o conteúdo não é executado.
- Privacidade: backup e restauração são locais por padrão; catálogo, handles, caminhos privados, caches e dados de sessão não são exportados; a pessoa escolhe explicitamente incluir Bíblias.
- Desempenho: enumeração, compressão, leitura e restauração são incrementais; buffers ativos ficam limitados a 16 MiB, com verificação prévia de quota e limite configurável de até 100.000 entradas/10 GiB por pacote nesta primeira versão.
- Recuperação: o workspace ativo e a última cópia funcional sobrevivem a falha de rede, permissão, quota, interrupção ou checksum; staging incompleto é identificável e não é confundido com conteúdo autoral.
- Interoperabilidade: um pacote produzido no OPFS pode ser consumido por adaptadores locais e nativos que implementem o contrato versionado, preservando arquivos e IDs portáteis.
- Acessibilidade: o fluxo expõe progresso, pausa/falha/sucesso, itens omitidos, conflito, quota e próximo passo por texto; controles são navegáveis por teclado e funcionam em mobile/desktop, claro/escuro e zoom.
- Observabilidade local: eventos registram fase, versão, contagens e códigos de erro sem conteúdo completo, segredos ou caminhos absolutos.

## Dependências

- `SPEC-0016` — múltiplos workspaces, seleção, identidade, adaptadores e barreira de autosave; deve estar Planned/Plan Gate antes da implementação desta fatia.
- `BACKLOG-0017` / sua spec promovida — catálogo local, identidade portátil, colisão e propriedade da raiz.
- `BACKLOG-0018` / sua spec promovida — contrato Markdown/JSON, sidecars autorais e índice reconstruível.
- Adaptadores `WorkspaceStorage` para OPFS, File System Access e Tauri e as operações atômicas disponíveis por backend.
- Runtime de SQLite/WASM usado pelo índice e parser/serializer Markdown já usado pelo editor.

## Situações de erro

- Autosave pendente ou falho: bloquear o início/sucesso, explicar a pendência e oferecer tentar novamente ou cancelar.
- Workspace indisponível, permissão revogada ou quota insuficiente: preservar o estado anterior, informar o backend e permitir reconectar, escolher destino ou cancelar.
- Manifesto ausente, versão incompatível, JSON inválido ou checksum divergente: rejeitar antes do commit e manter o staging isolado para relatório/limpeza.
- Caminho inseguro, duplicado, reservado ou tipo não suportado: rejeitar a entrada e impedir qualquer escrita fora do destino preparado.
- Interrupção durante streaming ou commit: manter o destino anterior, remover ou marcar staging e oferecer recuperação sem tratar temporário como workspace válido.
- ID de origem já cadastrado: criar novo ID no modo padrão e informar a relação de cópia; impedir duplicata silenciosa.
- Colisão de arquivo: bloquear sobrescrita implícita, permitir somente política explícita e preservar o arquivo original.
- SQLite de Bíblia ausente, duplicado ou diferente: respeitar a política escolhida, deduplicar apenas por hash igual e relatar a fonte que não foi instalada.
- Índice ausente ou reconstrução falha após commit: abrir autoral, marcar projeção indisponível e oferecer reconstrução posterior.
- Navegador sem seletor de pasta ou salvamento streaming: usar download/upload de arquivo conforme a capacidade disponível ou informar que a operação exige destino compatível; não simular uma pasta nativa.

## Escopo

### Dentro

- Backup e restauração do workspace ativo para pacote portátil versionado.
- Enumeração recursiva de Markdown, JSON, anexos e arquivos autorais permitidos.
- Manifesto, versionamento, metadados portáteis, checksums, política de Bíblias e relatório.
- Barreira de autosave, streaming com limite de memória, staging, commit, rollback e recuperação.
- Validação contra traversal, absolutos, duplicatas, colisões, symlinks, tipos especiais, quota e IDs duplicados.
- Restauração em workspace novo como padrão, com conflitos explícitos e reconstrução do índice.
- Fluxo na configuração existente, responsivo, acessível e compatível com OPFS, File System Access e Tauri.

### Fora

- Sincronização contínua, transporte remoto e resolução de conflitos Automerge (BACKLOG-0020).
- Agentes de IA, chaves de provedores, embeddings e política de rede (BACKLOG-0021).
- Catálogo entre dispositivos, handles, localStorage, cache do service worker ou restauração do estado do navegador.
- Conversão de Bíblias SQLite para Markdown/JSON ou alteração do conteúdo dessas fontes.
- Hospedagem de backup, conta, criptografia de nuvem, compartilhamento automático e agendamento recorrente.
- Implementação da identidade e do seletor de múltiplos workspaces, que pertence ao BACKLOG-0017.

## Dúvidas, decisões e riscos

- **Decisão D-001 — Pacote:** usar um pacote portátil versionado com `openbible-backup.json`, arquivos relativos e SHA-256; a extensão e o contêiner exatos ficam para a spec, mas o contrato não depende de um caminho local.
- **Decisão D-002 — Fonte incluída:** incluir conteúdo autoral e anexos por padrão; excluir índice/projeções e estado do dispositivo; Bíblias SQLite entram somente por escolha explícita e relatório de política.
- **Decisão D-003 — Integridade:** aplicar barreira de autosave, snapshot estável, streaming, manifesto, checksums e staging antes do commit.
- **Decisão D-004 — Segurança de restauração:** criar workspace novo com ID novo quando necessário; não sobrescrever o ativo nem resolver conflitos silenciosamente.
- **Decisão D-005 — Índice:** nunca transportar `.openbible/index.sqlite`; abrir o conteúdo mesmo se a reconstrução do índice pós-restore falhar.
- **Risco R-001 — Quota e arquivos grandes:** OPFS e navegadores podem impor limites diferentes. A spec deve definir o adaptador de fluxo, limites visíveis e recuperação sem depender de uma Blob integral em memória.
- **Risco R-002 — Atomicidade entre backends:** rename/commit têm capacidades distintas em OPFS, File System Access e Tauri. A implementação deve manter staging, marcador de recuperação e invariantes equivalentes, sem prometer atomicidade física onde a plataforma não oferece.
- **Risco R-003 — Conteúdo desconhecido:** Files Over Apps favorece preservar arquivos não reconhecidos; a validação deve tratar conteúdo como dados e reservar apenas áreas operacionais documentadas.
- **Nenhuma lacuna aplicável para promover o brief ao specify:** política padrão de Bíblias, destino seguro, exclusões, integridade, conflitos, limites e dependências foram definidos para a primeira spec.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Brief pronto para especificar

1. **Problema e objetivo:** dar posse e recuperação aos dados do PWA por meio de um backup portátil verificável e uma restauração conservadora entre OPFS, pasta selecionada e Tauri.
2. **Atores:** a pessoa usuária individual do workspace ativo; adaptadores de storage executam leitura/escrita local conforme as capacidades do ambiente.
3. **Escopo:** pacote versionado, enumeração recursiva, conteúdo autoral, anexos, Bíblias opcionais, manifesto/checksums, streaming, validação, staging/rollback, novo workspace e reconstrução do índice.
4. **Jornadas e regras:** criar backup após autosave; escolher política de Bíblias; salvar/baixar pacote; selecionar pacote; validar; restaurar em novo workspace; revisar relatório; resolver conflito somente por ação explícita.
5. **Critérios:** AC-001 a AC-014 cobrem consistência, portabilidade, exclusões, integridade, limites, segurança, recuperação, colisões, índice e privacidade.
6. **Qualidades:** integridade, segurança, privacidade, desempenho limitado por streaming, recuperação, acessibilidade e observabilidade local.
7. **Suposições:** o workspace ativo e seus adaptadores fornecem enumeração, leitura/escrita e flush; o índice continua derivado; uma área de staging pode ser criada no backend destino.
8. **Decisões abertas:** nenhuma lacuna aplicável; a spec poderá escolher o contêiner de arquivo e detalhar contratos por backend sem mudar o comportamento confirmado.
9. **Vocabulário:** `backup` é cópia portátil verificável; `restore` é materialização em destino local; `fonte autoral` é arquivo que a pessoa pode ler/editar; `índice` é projeção reconstruível; `catálogo/handle/cache` são estado local do aparelho e não pertencem ao pacote.

## Próximo passo

Promover para `$specsfy-03-specify` e criar a fonte normativa sem iniciar implementação.

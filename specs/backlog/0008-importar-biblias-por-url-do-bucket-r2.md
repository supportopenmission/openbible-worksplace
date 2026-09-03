# Backlog: Importar Bíblias por URL do bucket R2

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0008 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Leitor da Bíblia |
| Funcionalidade | Importação remota de Bíblias |
| Tipo | história |
| Prioridade | Alta |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | specs/defined/0008-importar-biblias-por-url-do-bucket-r2/spec.md |

## Ideia original

precisamos usando o specsfy implementar uma funcionalidade que podemos passar uma url do bucket do R2 que contem as biblias, e ele vai baixar os arquivos sqlite e importar as biblias. Fluxo: Colocar a url mostra os arquivos sqls disponíveis para importar, mostrar o progresso de cada arquivo de download e instalar as versões.

## Problema percebido

Hoje só há importação local por arrastar e soltar; falta distribuição remota das Bíblias via URL R2.

## Pessoa afetada ou beneficiada

Pessoa usuária individual do OpenBible

## Resultado ou valor esperado

Informar URL base do bucket R2, ver .sqlite disponíveis, acompanhar progresso por arquivo e instalar versões validadas em bibles/.

## Contexto

Workspace web SvelteKit com bibles/*.sqlite OpenLP; onboarding e /bible e /config já importam local; R2 é distribuição pública via HTTPS com possível CORS; distinguir URL base de arquivo único.

## Referências relacionadas

- `specs/inbox/2026-09-03-162849-importar-biblias-por-url-do-bucket-r2.md` — captura original (declaração).
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — onboarding local, importação por drag-drop, fora de escopo original “download por URL” (spec relacionada).
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — leitor SQLite OpenLP, validação book/verse (spec relacionada).
- `apps/web/src/lib/storage/workspace.ts` — `importBibleFiles`, validação `isSQLite`, status pending/complete/partial (documentação relacionada).
- `apps/web/src/lib/features/bible/bible-reader.ts` — `loadBibleCatalog`, validação OpenLP (documentação relacionada).
- `apps/web/src/lib/features/onboarding/OnboardingModal.svelte` — etapa import local a estender (documentação relacionada).
- `.specsfy/RULES.md` — “acessados por URL de distribuição como Cloudflare R2” (regra).
- `PROJECT.md` — capacidades “acesso a bancos SQLite por URL de distribuição” (contexto).

## Comportamento esperado

- Pessoa informa URL base pública HTTPS do bucket R2 (ex.: `https://biblias.exemplo.com/`).
- Sistema resolve `<base>/manifest.json` (fallback `<base>/index.json`) com lista `{ files: [{ name, url, size?, sha256? }] }`; se a URL informada terminar em `.sqlite`, trata como arquivo único.
- Sistema lista arquivos `.sqlite` disponíveis com nome, tamanho quando conhecido e estado (não instalado / instalado / selecionado).
- Pessoa seleciona um ou mais arquivos e confirma instalação.
- Sistema baixa cada arquivo com progresso individual 0–100%, valida assinatura SQLite + schema OpenLP mínimo (book/verse), grava em `bibles/<nome>` sem sobrescrever existente, atualiza catálogo e status de importação.
- Falha de um arquivo não cancela os demais; resultado parcial visível.

## Regras de negócio

- Somente HTTPS; URL deve ser https pública sem autenticação nesta fatia.
- Não sobrescrever `bibles/<nome>` existente; marcar como `duplicate`.
- Rejeitar individualmente: rede/CORS, HTTP ≠ 2xx, download incompleto, assinatura SQLite inválida, schema OpenLP inválido, falha de escrita.
- Manifest inválido ou vazio deve gerar erro recuperável sem limpar seleção anterior válida.
- Nenhum conteúdo é enviado ao servidor; download é cliente → R2 → workspace local/OPFS.

## Critérios de aceitação

- Given URL base válida com manifest, When carregar, Then lista somente `.sqlite` com nome/tamanho/estado.
- Given lista carregada, When selecionar e instalar, Then cada arquivo mostra progresso próprio e termina como instalado ou rejeitado com motivo.
- Given arquivo já existente em `bibles/`, When instalar de novo, Then mantém o existente e marca `duplicate`.
- Given URL inválida ou bucket sem CORS, When carregar, Then mostra erro recuperável com ação de tentar de novo.

## Qualidades e operação

- Segurança: somente HTTPS público; sem token nesta fatia; validar tamanho via Content-Length quando disponível; limitar a `.sqlite`.
- Privacidade: URL informada fica local (preferences/config local); nenhum dado sai para servidor próprio.
- Desempenho e volume: download por streaming com `ReadableStream`; arquivos grandes (50–200 MB) não podem travar a UI; um download por vez ou concorrência limitada a 2.
- Auditoria e observabilidade: progresso por arquivo + resultado final; diagnostics no catálogo para rejeitados.
- Acessibilidade: campo URL com label visível, lista operável por teclado, progresso com `aria-valuenow`, erros em `role=alert`.

## Dependências

- Bucket R2 público com CORS `Access-Control-Allow-Origin` liberado para o origin do app + `manifest.json` na raiz.
- `sql.js` existente para validação OpenLP; `WorkspaceStorage` existente para escrita.

## Situações de erro

- URL sem esquema https, manifest 404, JSON inválido, lista vazia, CORS bloqueado, HTTP erro, download interrompido, SQLite inválido, OpenLP inválido, duplicado, escrita falhou, armazenamento cheio (QuotaExceededError).

## Escopo

- Dentro: campo URL + carregar lista; manifest.json/index.json + URL direta .sqlite; seleção multipla; download com progresso por arquivo; validação e instalação em `bibles/`; reuso em onboarding, `/bible` vazio e `/config`; testes Vitest.
- Fora: autenticação R2/S3, ListObjects assinado, sincronização contínua, atualização automática de versões, upload para o bucket, paginação server-side, cache offline dos SQLite remotos no service worker.

## Dúvidas, decisões e riscos

- Decisão: manifest JSON na base (`manifest.json`, fallback `index.json`) como contrato de listagem; inferência técnica para evitar depender de List XML do R2 que exige configuração extra. A revisar se o bucket real já expõe outro formato.
- Decisão: suportar URL direta `.sqlite` como atalho de arquivo único (declaração “url do bucket” + fluxo “arquivos disponíveis” → cobre os dois).
- Risco: CORS do R2 pode bloquear leitura; mitigar com mensagem específica e orientação de CORS.
- Risco: arquivos grandes em OPFS/mobile; mitigar com streaming + escrita única ao final + mensagem de quota.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

- Promover para `$specsfy-03-specify` como SPEC-0008.

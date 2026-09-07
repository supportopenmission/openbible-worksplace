# Pesquisa local — fronteiras de agentes

Registro local das fontes e decisões usadas na SPEC-0020. Os artefatos são
informativos; `spec.md` continua sendo a fonte normativa.

## R-001

O bridge web e o registro de comandos Tauri existentes não possuíam uma
capability de agente antes desta fatia. A implementação nova é allowlisted e
devolve apenas estado redigido.

## R-002

As notas e metadados autorais permanecem no backend operacional local
(`app.sqlite` no Tauri ou IndexedDB no PWA), enquanto Markdown/JSON são fontes
portáteis e o índice é projeção reconstruível.

## R-003

O service worker atual trata cache e navegação. Ele não hospeda execução de
agente, fila durável, prompt, resposta ou credencial.

## R-004

Antes da implementação não havia adapter de provedor, gateway ou cofre nativo
no projeto. A primeira fronteira entregue adiciona `keyring` no backend Rust e
mantém o gateway PWA como capability opcional.

## R-005

As fontes oficiais da OpenAI sobre segurança de API keys orientam que chaves
não sejam expostas em browser ou bundle. Por isso o PWA usa apenas gateway
confiável e token efêmero de sessão.

## R-006

O credential store nativo é acessado por uma interface Rust com `keyring`,
compatível com Keychain, Credential Manager e Secret Service conforme o target.
Não existe fallback para arquivo, SQLite, variável serializada ou frontend.

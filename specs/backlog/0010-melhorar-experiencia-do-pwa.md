# Backlog: Melhorar experiência do PWA

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0010 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Experiência PWA |
| Funcionalidade | Shell instalável e notificações locais |
| Tipo | melhoria |
| Prioridade | Alta |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | specs/defined/0010-melhorar-experiencia-do-pwa/spec.md |

## Ideia original

precisamos melhorar a experiencia do pwa: favicon com logo-minimal, standalone nativo, remover header no mobile com título por página, safe area e cores fluidas, verificar offline e push no worker, versão 0.4.0 visível

## Problema percebido

PWA com favicon incorreto, header redundante no mobile, safe area e cores pouco fluidas, status incerto de offline/push e sem versão visível

## Pessoa afetada ou beneficiada

Pessoa que usa o OpenBible como PWA no mobile

## Resultado ou valor esperado

PWA com aparência de app nativo, navegação fluida e versão visível

## Contexto

App shell SvelteKit com manifesto standalone, service worker versionado, sidebar desktop e barra inferior mobile; logo-minimal já existe em static/

## Referências relacionadas

- `specs/inbox/2026-09-03-194051-melhorar-experiencia-do-pwa.md` — captura original desta fatia.
- `specs/inbox/2026-08-31-234532-pwa-tema-navegacao-responsiva.md` — precedente PWA/standalone/safe-area/offline.
- `apps/web/static/manifest.webmanifest` — manifesto standalone atual.
- `apps/web/src/app.html` — favicon, theme-color e meta PWA atuais.
- `apps/web/src/service-worker.ts` — cache offline atual, sem push.
- `apps/web/src/lib/features/workspace/AppFrame.svelte` — header desktop/mobile e barra inferior.
- `apps/web/static/logo-minimal.png` — base do novo favicon e ícones.

## Comportamento esperado

- Favicon e ícones 192/512 + apple-touch regenerados a partir de `logo-minimal.png`.
- Manifesto mantém `display: standalone`, `start_url`, `scope` e cores por tema.
- Mobile sem header global; cada página exibe seu próprio título (reuso do título/PageHeader existente) com barra inferior como navegação.
- Safe area com `viewport-fit=cover`, `env()` e `theme-color` claro/escuro dinâmico para tela fluida.
- Offline verificado via service worker (rotas locais + fallback); lembrete local diário de estudo às 9h, editável em Configurações, sem backend push.
- Versão `0.4.0` visível no rodapé da sidebar desktop e em Configurações.

## Regras de negócio

- Sem backend/VAPID nesta fatia; notificações são locais e agendadas no dispositivo.
- Permissão de notificação é opcional e revogável; sem permissão não há lembrete, sem erro bloqueante.
- Lembrete padrão 9h, editável; persistido localmente.
- Markdown/YAML continua fonte de sermões/notas; SQLite auxiliar inalterado.

## Critérios de aceitação

- Given PWA instalado, When aberto, Then abre em standalone sem barra de navegador.
- Given mobile, When navega entre rotas, Then nenhum header global aparece e cada página mostra seu título.
- Given favicon/ícones, When inspecionados, Then derivam do logo-minimal com maskable correto.
- Given offline após primeiro acesso, When abre rota local já carregada, Then conteúdo cacheado abre com aviso não bloqueante.
- Given lembrete ativo às 9h, When horário chega, Then notificação local "Hora de estudar a Bíblia" aparece.
- Given sidebar/config, When exibidos, Then versão 0.4.0 está visível.

## Qualidades e operação

- Segurança: sem backend novo; sem segredo.
- Privacidade: lembrete e versão locais, sem rastreamento.
- Desempenho e volume: sem regressão no cache do app shell.
- Auditoria e observabilidade: versão visível facilita diagnóstico.

## Dependências

- `logo-minimal.png` existente; Notification API do navegador.

## Situações de erro

- Notificação negada → lembrete fica inativo com orientação para reativar, sem bloquear o app.
- Service worker indisponível em desenvolvimento → limpa cache local como hoje, sem quebrar a navegação.
- Rota nunca carregada offline → fallback para `/` com mensagem 503 atual.

## Escopo

- Dentro: favicon/ícones, manifesto standalone, remoção do header mobile com título por página, safe-area/tema fluido, verificação offline, lembrete local 9h editável, versão 0.4.0 na sidebar e config.
- Fora: push remoto com VAPID/backend, sincronização remota, Tauri.

## Dúvidas, decisões e riscos

- DEC-001 (2026-09-03, conversa atual): push = lembrete local diário 9h editável em Config, sem VAPID.
- DEC-002: versão visível em Sidebar + Config.
- DEC-003: mobile reusa título da página.
- DEC-004: regenerar favicon + ícones a partir do minimal.
- DEC-005: safe-area com tema dinâmico fluido.
- Risco: iOS limita agendamento de notificações locais com app fechado; documentar limite.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Brief pronto para `$specsfy-03-specify`.

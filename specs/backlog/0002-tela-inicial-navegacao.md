# Backlog: Tela inicial e navegação do OpenBible

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0002 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Entrada e navegação do produto |
| Funcionalidade | Tela inicial configurável |
| Tipo | Funcionalidade de interface |
| Prioridade | P1 |
| Milestones | |
| Criado em | 2026-09-01 |
| Spec promovida | `specs/completed/0002-tela-inicial-navegacao/spec.md` |

## Ideia original

vamos a tela inicial usado o componente do shadnui (svelte-cn) item, e teremos tres opcoes iniciar: Ler a biblia e Montar um sermao e montar um estudo (em breve). e ao clicar vai para rotas: bible, sermons, and study. Teremos uma pagina de config aonde podemos definir qual é a tela inicial, para que ele possa abrir automaticamente na proxima vez que entrarmos no /. Crie um Sidebar que deve aparecer se o usuario tiver definido uma tela inicial, esse sidebar deve ser criado usando o componente do shadnui (svelte-cn).

## Problema percebido

A aplicação ainda não apresenta uma entrada clara para as áreas do produto nem permite retomar automaticamente a área preferida ao abrir /.

## Pessoa afetada ou beneficiada

Pessoa usuária individual do OpenBible, sem conta ou autenticação.

## Resultado ou valor esperado

Uma tela inicial orienta a entrada em Bíblia, sermões ou estudo futuro; a preferência configurada reabre a área escolhida e habilita a navegação persistente.

## Contexto

Nova camada de produto sobre o onboarding de workspace existente em apps/web. A implementação deve usar SvelteKit/Svelte, introduzir shadcn-svelte real para Item e Sidebar, criar /bible, /sermons, /study e /config, e manter / como seletor sem preferência válida.

## Referências relacionadas

- `specs/inbox/2026-08-31-222704-tela-inicial-e-navegacao-do-openbible.md` — origem da ideia.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — spec relacionada; fornece o workspace e declara as áreas de produto fora do escopo anterior.
- `PROJECT.md` — documentação relacionada; finalidade e uso individual do produto.
- `INTERFACE.md` e `DESIGNSYSTEM.MD` — documentação relacionada; stack Svelte e padrões de shell/interface.
- `.specsfy/DATABASE.md` — dado relacionado; preferência da tela inicial.

## Comportamento esperado

1. Na rota `/`, sem preferência válida, a pessoa vê três opções de entrada: Ler a Bíblia, Montar um sermão e Montar um estudo (em breve).
2. A opção de Bíblia navega para `/bible`; a opção de sermão navega para `/sermons`; a opção de estudo exibe indisponibilidade e não navega até a capacidade ser implementada.
3. A rota `/config` permite selecionar uma tela inicial entre Bíblia e sermão, ou remover a preferência. A opção de estudo fica visível como indisponível até existir uma jornada funcional.
4. Ao entrar em `/` com uma preferência válida, a aplicação navega automaticamente para a rota escolhida.
5. O shell com Sidebar aparece quando existe uma preferência válida e oferece links para `/bible`, `/sermons`, `/study` e `/config`, destacando a rota atual. Em viewport estreito, o Sidebar deve poder ser aberto/fechado sem cortar os rótulos.

## Regras de negócio

- A preferência da tela inicial é individual e local; não exige autenticação nem envio para servidor.
- A rota `/` é o seletor somente quando não há uma preferência válida; uma preferência inválida é tratada como ausente.
- `/study` é uma entrada visível em estado “em breve”, sem simular uma capacidade pronta.
- A configuração usa `/config` como destino público da página de preferência; essa escolha é reversível e não altera o vocabulário das áreas.

## Critérios de aceitação

- **AC-001:** Dado que não existe tela inicial definida, quando a pessoa abre `/`, então vê exatamente as opções Ler a Bíblia, Montar um sermão e Montar um estudo (em breve), usando itens de interface do shadcn-svelte.
- **AC-002:** Dado que a pessoa está na tela inicial, quando ativa Ler a Bíblia ou Montar um sermão, então navega para `/bible` ou `/sermons` respectivamente; quando ativa Montar um estudo, então permanece no seletor e recebe indicação de “em breve”.
- **AC-003:** Dado que a pessoa salva Bíblia ou sermão como tela inicial em `/config`, quando entra em `/` novamente, então é encaminhada automaticamente para a rota escolhida e o Sidebar fica visível.
- **AC-004:** Dado que existe uma tela inicial salva, quando a pessoa usa o Sidebar, então consegue acessar as rotas Bíblia, Sermões, Estudo e Configuração, com a rota atual identificada e o controle responsivo em mobile.
- **AC-005:** Dado que a pessoa remove a tela inicial, quando retorna a `/`, então vê novamente o seletor e o Sidebar deixa de ser exibido.

## Qualidades e operação

- Segurança: a preferência não contém segredo, não concede acesso e permanece restrita ao navegador da pessoa usuária.
- Privacidade: nenhuma rota ou dado de leitura, estudo ou sermão é enviado para servidor pela preferência.
- Desempenho e volume: a decisão da rota deve ocorrer no carregamento do cliente sem bloquear a renderização por operação remota.
- Auditoria e observabilidade: não há conta nem auditoria remota no MVP; falhas de leitura devem cair no seletor sem quebrar a aplicação.

## Dependências

- `shadcn-svelte` ainda não está configurado em `apps/web` e precisa ser inicializado antes de adicionar `Item` e `Sidebar`.
- A implementação preserva o onboarding da spec 0001 e deve renderizar o novo seletor somente após o workspace estar configurado.

## Situações de erro

- Preferência ausente, inválida ou ilegível → tratar como nenhuma preferência, mostrar o seletor e não exibir o Sidebar.
- Falha de navegação → manter o link sem mascarar o erro do roteador; as páginas mínimas devem existir para as três rotas solicitadas.
- Estudo ainda não implementado → item desabilitado/indisponível com texto “Em breve”, sem navegar.

## Escopo

- Dentro: tela inicial; itens shadcn-svelte; rotas `/bible`, `/sermons`, `/study` e `/config`; preferência persistente; shell Sidebar condicional; páginas mínimas de destino; testes de navegação, persistência, estado indisponível e responsividade.
- Fora: leitor de Bíblia, biblioteca de textos, construtor de sermões, conteúdo de estudos, autenticação, sincronização, dados remotos e implementação funcional de `/study`.

## Dúvidas, decisões e riscos

- Decisão: usar `/config` para a configuração da tela inicial e deixar a rota `/` como seletor sem preferência.
- Decisão: usar uma preferência local de escolha entre rotas; a tecnologia de persistência é detalhe reversível e será definida no plano técnico.
- Risco: instalar os componentes copiados do shadcn-svelte adiciona configuração de CSS e dependências ao app web; validar com typecheck, lint, testes e build.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover para `$specsfy-03-specify` e consolidar a spec normativa.

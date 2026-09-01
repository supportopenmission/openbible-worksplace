# Config page com tabs desktop e sections mobile

## Declaração

ok usando specsfy crie um pagina de config baseado na vercel guideline design. remova aquele titulo grande e tals. talvez podemos ter tabs no desktop e sections no mobile, pense sobre isso.

## Inferência

- A página `/config` atual usa cabeçalho hero grande (h1 ~4rem) e seções com títulos grandes; isso conflita com o guideline Vercel (hierarquia tipográfica contida, superfícies contínuas).
- Desktop: navegação por abas entre “Armazenamento/workspace” e “Tela inicial”.
- Mobile: mesmas áreas como seções empilhadas com rótulos discretos, sem tabs.
- Manter funcionalidades existentes: WorkspaceSettings, InitialScreenPicker, breadcrumb leve.

## A revisar

- Nome exato das abas/seções.
- Se tema ou outras preferências entram nesta fatia.

## Próximo passo

Promover para spec de interface em `specs/in-progress/` e implementar com testes browser existentes estendidos.

# Permissão de pastas no navegador integrado

- Consultado em 2026-09-04.
- [Issue #42437 do Codex](https://github.com/openai/codex/issues/42437): no
  navegador integrado do macOS, `showDirectoryPicker()` pode rejeitar com
  `AbortError` depois de a pessoa confirmar a pasta.
- [Documentação MDN de `showDirectoryPicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker):
  `AbortError` também cobre restrições ou falhas de permissão impostas pelo
  agente de usuário, não apenas o cancelamento explícito.

Conclusão aplicável: o OpenBible deve manter a seleção local como primeira
opção e oferecer OPFS somente por ação explícita quando o host integrado não
conseguir conceder o handle.

# OpenBible Desktop

Shell Tauri v2 para macOS 13+ (Intel e Apple Silicon). A interface é o build
compartilhado de `apps/web`; comandos de filesystem, SQLite, migração e lock
serão registrados em `src-tauri`.

## Desenvolvimento

```bash
bun run --cwd apps/desktop dev
```

## Build de teste

```bash
bun run --cwd apps/desktop build
```

O build usa o target `universal-apple-darwin` e `--no-sign`. Assinatura,
notarização e distribuição pública permanecem fora da primeira fatia.

## Linux (Debian, Arch Linux e Omarchy)

```bash
bun run --cwd apps/desktop build:linux
```

O comando produz `.deb` e `.AppImage` em `apps/desktop/src-tauri/target/release/bundle/`.
Use o `.deb` em Ubuntu/Debian. No Arch Linux e no Omarchy, use o `.AppImage`:
torne-o executável com `chmod +x` e abra-o diretamente. Em instalações mínimas,
WebKitGTK e FUSE 2 podem ser necessários.

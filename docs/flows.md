# Fluxos

<!-- specsfy:documentator:start -->
## Fluxo principal

```mermaid
flowchart LR
  Entrada --> Aplicação --> Saída
```

```mermaid
sequenceDiagram
  participant Cliente
  participant Aplicação
  Cliente->>Aplicação: requisição
```
<!-- specsfy:documentator:end -->

## Jornada de produto confirmada

```mermaid
flowchart TD
  Root["/"] -->|sem preferência| Picker[Seletor inicial]
  Root -->|bible salvo| Bible["/bible"]
  Root -->|sermons salvo| Sermons["/sermons"]
  Picker --> Bible
  Picker --> Sermons
  Picker -.-> Study["/study: Em breve"]
  Config["/config"] -->|salvar ou remover| Root
  Bible --> Sidebar[Sidebar]
  Sermons --> Sidebar
  Study --> Sidebar
  Sidebar --> Config
```

Sem preferência válida, `/` é renderizada sem o shell para manter a escolha como
a única decisão principal. Com Bíblia ou sermão salvo no armazenamento local, a
entrada em `/` usa `goto` para a rota correspondente e o shell mostra o Sidebar.

```mermaid
flowchart LR
  Biblioteca --> Editor[Construtor de sermões]
  Biblioteca --> Leitor[Leitor da Bíblia]
  Editor --> Notas[Notas simples]
  Leitor --> Editor
```

O fluxo é individual e sem autenticação. O usuário poderá importar um SQLite
bíblico por arrastar e soltar ou informar uma URL de distribuição.

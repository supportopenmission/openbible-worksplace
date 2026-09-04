# Inbox: Versão nativa macOS com Tauri e armazenamento local

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-04T19:47:40Z |
| Slug | versao-nativa-macos-com-tauri-e-armazenamento-local |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `c63760b992918ab15b12e1257f90a5d0d448e47b2d19770eadb25aa741542473` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Precisamos implementar um app que será a versao nativa do app, iremos usar o tauri, vamos começar com a build de macos, a ideia é termos o a interface como temos no web, só que ao inves de usar o OPFS iremos usar a pasta nativa do computador. E o sqlite será acessado diretamente do tauri. usando specsfy vamos planejar e vamos até o passo 6, o implemente depois vamos para o implemente.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Planejar a versão nativa macOS do OpenBible com Tauri, preservando a interface web e trocando OPFS por pasta nativa e acesso direto ao SQLite.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** O app web usa OPFS; a versão desktop precisa persistir dados em uma pasta nativa e acessar SQLite pelo backend Tauri.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoa usuária individual do OpenBible no macOS.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Disponibilizar a mesma experiência do app web em um app nativo macOS com armazenamento local confiável.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Declaração: usar Tauri; começar pela build macOS; preservar a interface web; substituir OPFS por pasta nativa do computador; acessar SQLite diretamente pelo Tauri; planejar até o passo 6 do Specsfy e implementar depois. Inferência: será necessária uma ponte tipada entre SvelteKit e comandos Tauri.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Configuração do workspace, arquivos Markdown, bancos SQLite auxiliares e bases bíblicas precisam ser lidos/escritos na pasta nativa; contratos e política de migração ainda não definidos.

### Riscos e dependências

**Análise preliminar:** Compatibilidade entre runtime web e Tauri, segurança de caminhos e comandos, diferenças macOS Intel/Apple Silicon, migração de dados do OPFS e consistência SQLite.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Criar fatia de shell nativo macOS; adaptar camada de armazenamento; expor comandos Tauri para SQLite; manter UI compartilhada; definir empacotamento e testes.

## Pontos a revisar no futuro

**A revisar:** Definir versão do Tauri e Rust; alvo mínimo do macOS e arquiteturas; diretório padrão e escolha de pasta; estratégia de migração OPFS; API de comandos e erros; esquema de permissões/capabilities; build/assinatura/notarização; escopo de paridade de telas; observabilidade e distribuição.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

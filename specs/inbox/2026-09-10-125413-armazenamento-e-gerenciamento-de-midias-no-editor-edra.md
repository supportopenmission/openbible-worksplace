# Inbox: Armazenamento e gerenciamento de mídias no editor Edra

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-10T15:54:13Z |
| Slug | armazenamento-e-gerenciamento-de-midias-no-editor-edra |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `791057268258a694dbad09f866a8c86b52aa408d50d709de6af06b8c1bbeee20` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

No editor edra precisamos trabalhar em coisa, os blocks de imagens, video, audio eles quebram ao inserir uma imagem quando tentamos fazer o upload, precisamos ver como podemos salvar isso no pwa e no desktop tauri, eu acho que no desktop podemos usar o .openbible que fica na pasta do usuario. mas se vc tiver outra ideia. e ai precisaremos tbm de ter nas configuracoes em uso e armazenamento uma opcao de gerenciar as midias, que iremos implementar uma pagina que mostra todas os arquivos usafos nas notas.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Definir como mídias usadas nas notas serão inseridas, persistidas e gerenciadas no PWA e no desktop Tauri.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Blocos de imagem, vídeo e áudio quebram ao inserir uma imagem por upload, e ainda não há uma solução definida para persistência e gerenciamento desses arquivos.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoas que editam notas no editor Edra e administram o armazenamento do workspace.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Permitir que mídias funcionem de forma confiável nas notas e oferecer uma página para listar e gerenciar os arquivos usados.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Escopo mencionado: blocos de imagem, vídeo e áudio; upload de imagem; persistência no PWA; persistência no desktop Tauri; possibilidade de usar .openbible na pasta do usuário; opção em Configurações > Uso e armazenamento; página com todos os arquivos usados nas notas.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** O sistema talvez precise guardar, consultar, relacionar com notas e apagar arquivos de mídia usados nas notas, com diferenças de backend entre PWA e desktop Tauri.

### Riscos e dependências

**Análise preliminar:** Compatibilidade entre PWA e Tauri; escolha do local e contrato de persistência; referências quebradas ao mover ou apagar mídias; migração e recuperação de arquivos; segurança e limites de armazenamento.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Investigar um contrato de storage de mídia compartilhado; avaliar OPFS/IndexedDB no PWA e diretório .openbible no desktop Tauri; criar catálogo de mídias com referências às notas; adicionar gerenciamento em Configurações > Uso e armazenamento.

## Pontos a revisar no futuro

**A revisar:** Definir formatos e tamanho máximo; decidir se vídeos/áudios serão importados ou apenas referenciados; definir organização física e nomes dos arquivos; definir comportamento ao apagar mídia em uso; decidir se haverá migração de mídias existentes; definir permissões e limites por plataforma.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.

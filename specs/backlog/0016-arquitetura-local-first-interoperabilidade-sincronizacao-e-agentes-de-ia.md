# Backlog: Arquitetura local-first, interoperabilidade, sincronização e agentes de IA

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0016 |
| Status | Refining |
| Produto | OpenBible |
| Épico | Arquitetura local-first e portabilidade dos dados |
| Funcionalidade | A esclarecer |
| Tipo | Épico |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-05 |
| Spec promovida | Nenhuma |

## Ideia original

Evoluir o OpenBible segundo Files Over Apps: conteúdo local e portátil em desktop Tauri e PWA; Markdown compatível com Obsidian, GitHub e PDF; dados autorais transferíveis; índices SQLite reconstruíveis; sincronização futura com Automerge; desktop como main driver; e agentes de IA configurados pela pessoa com sua própria API key. Formulação integral preservada em specs/inbox/2026-09-05-162057-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md.

Complemento declarado durante o refinamento: “Tem uma coisa que eu quero que você adicione também, se possível, é o seguinte: o suporte a workspaces. Como assim? nem no Obsidian. No Obsidian a gente tem um vault, né, que a gente tem um dropdown ali que a gente seleciona. A ideia é justamente, a gente pode configurar várias pastas e aí toda a aplicação vai ser gerida por causa daquela pasta, sabe? É o mesmo fluxo do Obsidian.”

## Problema percebido

O armazenamento atual mistura conteúdo autoral, dados não reconstruíveis e índices auxiliares, enquanto os fences Markdown têm interoperabilidade parcial e ainda não existe um contrato seguro para sincronização, recuperação do OPFS ou agentes de IA.

## Pessoa afetada ou beneficiada

Pessoa usuária individual do OpenBible que cria e consulta notas, sermões, estudos e destaques em desktop ou PWA e precisa continuar dona dos próprios dados.

## Resultado ou valor esperado

Dados legíveis e recuperáveis fora do OpenBible, com índices descartáveis, base preparada para sincronização entre aparelhos e acesso controlado por futuros agentes de IA.

## Contexto

Épico transversal relacionado às entregas existentes de editor Markdown, destaques, PWA/OPFS e Tauri. Inclui suporte a vários workspaces cadastrados, com um workspace ativo por vez e troca por seletor semelhante ao seletor de vault do Obsidian; toda operação da aplicação usa exclusivamente a pasta ativa. A implementação deve ser dividida em fatias dependentes e parar no Plan Gate antes de qualquer código de produto.

## Referências relacionadas

- `specs/inbox/2026-09-05-162057-arquitetura-local-first-interoperabilidade-sincronizacao-e-agentes-de-ia.md` — origem integral da iniciativa.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — spec relacionada: hoje prepara e reencontra um workspace e deixa reconfiguração/migração fora do escopo.
- `specs/in-progress/0014-versao-nativa-macos-tauri/spec.md` — spec relacionada: workspace nativo, lock de escritor único e registro atualmente singular do workspace ativo.
- `specs/in-progress/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile/spec.md` — spec relacionada: Markdown/CommonMark e bloco customizado de versículo.
- `specs/completed/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md` — spec relacionada: exportação de notas, expansão de fences e embed de vídeo.
- `specs/completed/0005-selecao-versiculos-highlights-nota-leitor/spec.md` e `specs/completed/0006-lista-highlights-indicador-nota-leitor/spec.md` — specs relacionadas: persistência e consulta de `reader_highlight` no índice SQLite.
- `PROJECT.md`, `.specsfy/DATABASE.md`, `docs/architecture.md` — documentação relacionada: Files Over Apps, OPFS, pasta nativa e separação atual entre Markdown/JSON/SQLite.

## Comportamento esperado

- A pessoa pode cadastrar mais de uma pasta como workspace do OpenBible.
- Um seletor permite identificar e trocar o workspace ativo, em fluxo comparável ao seletor de vault do Obsidian.
- Após a troca, todas as áreas da aplicação passam a ler e gravar somente na pasta ativa.
- Cada workspace mantém isolados conteúdo, Bíblias, preferências de conteúdo, índices, sincronização e contexto disponibilizado aos agentes de IA.

## Regras de negócio

- Exatamente um workspace fica ativo por janela/sessão da aplicação.
- Trocar o workspace não mistura notas, destaques, índices, anexos, estado de sincronização ou contexto de IA entre pastas.
- O lock de escritor único definido para o runtime nativo continua valendo por workspace, sem impedir que várias pastas sejam cadastradas.

## Critérios de aceitação

- A esclarecer antes de considerar o item refinado.

## Qualidades e operação

- Segurança: a avaliar.
- Privacidade: a avaliar.
- Desempenho e volume: a avaliar.
- Auditoria e observabilidade: a avaliar.

## Dependências

- BACKLOG-0017 — múltiplos workspaces no modelo de vaults.
- BACKLOG-0018 — formatos portáteis e índice reconstruível; depende de 0017.
- BACKLOG-0019 — backup e restauração do workspace PWA; depende de 0017 e 0018.
- BACKLOG-0020 — sincronização local-first com Automerge; depende de 0017, 0018 e 0019.
- BACKLOG-0021 — agentes de IA locais e controlados pelo workspace; depende da base estabelecida por 0017–0020.

## Situações de erro

- A esclarecer.

## Escopo

- Dentro: coordenar cinco fatias dependentes para múltiplos workspaces, portabilidade dos dados, backup/restauração do PWA, sincronização Automerge e agentes de IA.
- Fora: implementar todas as capacidades numa única spec ou iniciar código antes do Plan Gate de cada fatia.

## Dúvidas, decisões e riscos

- **Declaração:** devem existir vários workspaces configuráveis e um seletor semelhante ao vault switcher do Obsidian.
- **Conflito a resolver:** o modelo atual registra um único workspace por origem/perfil local; a nova capacidade precisa substituir esse registro singular sem quebrar workspaces existentes.
- **A revisar:** comportamento ao trocar com nota não salva, pasta indisponível, permissão revogada, sincronização em andamento ou agente de IA executando.
- **A revisar:** no PWA, decidir se “vários workspaces” significa vários diretórios OPFS lógicos, vários handles de pasta quando suportados, ou ambos.
- **Decisão D-001:** decompor o épico em cinco specs dependentes, na ordem: múltiplos workspaces; formatos portáteis e índice reconstruível; backup/restauração do PWA; sincronização com Automerge; agentes de IA. Fonte: conversa atual, resposta “1” à Pergunta 1, normalizada para a opção recomendada.

## Pronto para desenvolvimento

- [ ] O problema e a pessoa beneficiada estão claros.
- [ ] O evento inicial e o resultado esperado estão claros.
- [ ] Permissões, regras e exceções relevantes estão claras.
- [ ] O resultado pode ser verificado objetivamente.
- [ ] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [ ] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Aprofundar nesta etapa até o item ficar pronto para `$specsfy-03-specify`.

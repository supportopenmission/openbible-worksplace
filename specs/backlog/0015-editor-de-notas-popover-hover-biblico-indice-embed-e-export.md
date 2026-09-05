# Backlog: Editor de Notas - popover, hover biblico, indice, embed e export

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0015 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Notas |
| Funcionalidade | Editor Milkdown com popover, hover bíblico, índice, embed e export |
| Tipo | Melhoria |
| Prioridade | Alta |
| Milestones |  |
| Criado em | 2026-09-05 |
| Spec promovida | `specs/draft/0015-editor-de-notas-popover-hover-biblico-indice-embed-e-export/spec.md` |

## Ideia original

No Editor de Notas precisamos de algumas funcionalidades: Desative o selecao normal e add um popover com formatacao Bold, Italic, Underline, Highlights; No Verse Quando temos por exemplo Gn 3.1 mostrar um hover card com o texto biblico; implementar navegacao nos titulos e secoes da nota (Image 1, Image 2), no mobile add no dropdown menu Indices que abre um drawer e ao clicar no titulo navega ate a secao; Embed Video no Youtube; Export Note PDF and Markdown (com texto biblico sem o fence somente o verso biblicos). Complemento: add tbm nesse item a opcao de manter a barra de tarefas do editor sempre visivel, ocultar apenas no modo visualizacao.

## Problema percebido

Editar notas no canvas exige formatação rápida por popover, prévia bíblica sem sair da nota, navegação por títulos/seções, vídeo embutido e exportação fiel.

## Pessoa afetada ou beneficiada

Pessoa usuária individual, sem conta, que cria e consulta as próprias notas bíblicas no workspace local.

## Resultado ou valor esperado

Editar mais rápido no canvas com formatação por popover, prévia bíblica e navegação por títulos, mais vídeo e exportação.

## Contexto

Evolução de /notes/[id] no Milkdown vigente (BACKLOG-0013), mantendo Markdown+YAML como fonte e fence :::verse; abrange desktop e mobile com drawer de Índices.

## Referências relacionadas

- `specs/inbox/2026-09-05-131206-editor-de-notas-formatacao-hover-biblico-navegacao-embed-e-export.md` — origem principal dos 5 pedidos.
- `specs/inbox/2026-09-05-131455-editor-de-notas-barra-de-tarefas-sempre-visivel-exceto-visualizacao.md` — complemento da barra de tarefas, combinado neste item por pedido explícito.
- `specs/backlog/0013-motor-de-notas-com-milkdown-fence-de-versiculo-e-mobile.md` — backlog relacionado: base Milkdown vigente; este item é evolução, não duplicata.
- `specs/backlog/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo.md` — backlog relacionado: entrega original com fence `:::verse`.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/` — spec relacionada: comportamento vigente de fence, seletor e canvas.
- `INTERFACE.md` — `MilkdownNoteEditor`, `MilkdownMobileToolbar`, `VerseBlockView`, `VerseSelector`, `Dialog`/`Sheet` a estender.

## Comportamento esperado

**Declaração do usuário + decisões da descoberta:**

- Popover de formatação: ao selecionar texto no canvas, suprimir o menu nativo e mostrar só o popover com Negrito, Itálico, Sublinhado e Destaque.
- Hover bíblico: referências em texto livre tipo `Gn 3.1` mostram hover card com o texto; usa a versão do parser quando houver, senão a versão padrão; mantém o clique atual que abre o versículo.
- Índice de títulos: botão de índice no header da nota lista H1–H3 em dropdown no desktop e em drawer Índices no mobile; clique rola até a seção.
- Embed YouTube: colar URL ou slash `/video` insere bloco de vídeo validado; só aceita YouTube; URL inválida mostra erro.
- Exportação: botões Exportar PDF e Markdown no header geram arquivo com versos expandidos no lugar do fence, mantendo o original intacto.
- Barra de tarefas: opção nas configurações da nota, com padrão sempre visível na edição e oculta na visualização.

**Decisão da descoberta — Q1 Resultado:**
- Editar mais rápido no canvas com formatação por popover, prévia bíblica e navegação por títulos, mais vídeo e exportação.
- Fonte: Conversa atual, resposta à Pergunta 1. Confirmado em 2026-09-05.

**Decisão da descoberta — Q2 Popover:**
- Suprimir menu nativo do navegador e mostrar só o popover com Negrito, Itálico, Sublinhado e Destaque.
- Fonte: Conversa atual, resposta à Pergunta 2. Confirmado em 2026-09-05.

**Decisão da descoberta — Q3 Hover:**
- Versão do parser quando houver, senão versão padrão; mantém modal/clique atual do versículo.
- Fonte: Conversa atual, resposta à Pergunta 3 com texto livre. Confirmado em 2026-09-05.

**Decisão da descoberta — Q4 Índice:**
- Botão de índice no header lista H1–H3 em dropdown no desktop e drawer Índices no mobile, clique rola até a seção.
- Fonte: Conversa atual, resposta à Pergunta 4. Confirmado em 2026-09-05.

**Decisão da descoberta — Q5 Embed:**
- Colar URL ou slash `/video`, bloco validado só aceita YouTube, mostra erro em URL inválida.
- Fonte: Conversa atual, resposta à Pergunta 5. Confirmado em 2026-09-05.

**Decisão da descoberta — Q6 Export:**
- Botões Exportar PDF e Markdown no header geram arquivo com versos expandidos no lugar do fence, mantendo o original intacto.
- Fonte: Conversa atual, resposta à Pergunta 6. Confirmado em 2026-09-05.

**Decisão da descoberta — Q7 Toolbar:**
- Opção nas configurações da nota, com padrão sempre visível na edição e oculta na visualização.
- Fonte: Conversa atual, resposta à Pergunta 7. Confirmado em 2026-09-05.

**Decisão da descoberta — Q8 Fallbacks:**
- Sem Bíblia importada mostra aviso no hover e no export, URL inválida mostra erro inline, nota sem títulos mostra índice vazio.
- Fonte: Conversa atual, resposta à Pergunta 8. Confirmado em 2026-09-05.

## Regras de negócio

- File Over Apps: Markdown+YAML da nota permanece fonte; popover, hover, índice e embed não alteram o fence `:::verse` salvo; export gera artefato derivado sem tocar o original.
- Hover lê a Bíblia instalada; sem Bíblia, mostra aviso e mantém a ação de abrir no leitor; clique atual no versículo é preservado.
- Índice deriva de H1–H3 do documento; sem títulos, mostra estado vazio; navegação é rolagem até a seção.
- Bloco de vídeo guarda só URL YouTube validada; sem autoplay; sem rede mostra link; fora do YouTube é recusado com erro.
- Export Markdown troca cada `:::verse` por citação com referência e texto completo na versão do bloco; PDF espelha o mesmo conteúdo; original com fence permanece intacto.
- Toolbar segue o padrão sempre visível editando e oculta visualizando, com opção nas configurações da nota.

## Respostas confirmadas na descoberta

| Área | Pergunta | Resposta normalizada | Fonte | Confirmado em |
| --- | --- | --- | --- | --- |
| Escopo | Pergunta 1. Qual resultado resume melhor este item combinado? | Editar mais rápido no canvas com formatação por popover, prévia bíblica e navegação por títulos, mais vídeo e exportação | Conversa atual, resposta à Pergunta 1 | 2026-09-05 |
| Interface / popover | Pergunta 2. O que significa desativar a seleção normal? | Suprimir menu nativo e mostrar só popover com Negrito, Itálico, Sublinhado e Destaque | Conversa atual, resposta à Pergunta 2 | 2026-09-05 |
| Interface / hover | Pergunta 3. De onde vem o texto do hover? | Versão do parser quando houver, senão versão padrão; mantém clique atual | Conversa atual, resposta à Pergunta 3 | 2026-09-05 |
| Interface / índice | Pergunta 4. Como funciona a navegação por títulos? | Botão no header lista H1–H3 em dropdown desktop e drawer Índices mobile, clique rola | Conversa atual, resposta à Pergunta 4 | 2026-09-05 |
| Interface / embed | Pergunta 5. Como inserir e exibir YouTube? | Colar URL ou slash /video, só YouTube validado, erro em inválida | Conversa atual, resposta à Pergunta 5 | 2026-09-05 |
| Exportação | Pergunta 6. Como funciona export PDF/Markdown? | Botões no header geram arquivo com versos expandidos, original intacto | Conversa atual, resposta à Pergunta 6 | 2026-09-05 |
| Interface / toolbar | Pergunta 7. Onde fica a opção da barra? | Opção nas configurações da nota, padrão sempre visível editando e oculta visualizando | Conversa atual, resposta à Pergunta 7 | 2026-09-05 |
| Estados | Pergunta 8. Quais fallbacks garantir? | Sem Bíblia mostra aviso no hover e export, URL inválida erro inline, sem títulos índice vazio | Conversa atual, resposta à Pergunta 8 | 2026-09-05 |

## Critérios de aceitação

- Dado texto selecionado na edição, quando há seleção não colapsada, então o menu nativo é suprimido e o popover mostra Negrito, Itálico, Sublinhado e Destaque.
- Dada referência tipo `Gn 3.1` em texto livre, quando paira ou foca, então o card mostra o texto na versão do parser ou na padrão, com aviso se não há Bíblia.
- Dado o header da nota com títulos H1–H3, quando abre o índice no desktop, então vê dropdown; no mobile vê drawer Índices; ao clicar, rola até a seção.
- Dada URL YouTube colada ou slash `/video`, quando válida, então insere bloco de vídeo sem autoplay; quando inválida ou fora do YouTube, mostra erro inline.
- Dado o header com Exportar, quando exporta PDF ou Markdown, então o arquivo traz versos expandidos no lugar do fence e o original permanece com `:::verse`.
- Dada a configuração da nota, quando no modo edição a toolbar fica visível por padrão e na visualização fica oculta.
- Dada nota sem títulos, quando abre o índice, então vê estado vazio; sem Bíblia, hover e export mostram aviso sem bloquear a edição.

## Qualidades e operação

- Segurança: uso local sem conta; embed só YouTube validado, sem autoplay; sem envio do conteúdo a servidor.
- Privacidade: texto e referências ficam no workspace; carregamento do vídeo só sob ação da pessoa.
- Desempenho e volume: hover usa Bíblia instalada e snapshot quando houver; índice deriva do documento aberto; export expande blocos da nota atual.
- Auditoria e observabilidade: não aplicável no MVP.
- Interface: canvas full-bleed vigente; popover, hover card, dropdown/drawer e toolbar operáveis por teclado e toque, Escape fecha, foco visível, claro/escuro, `prefers-reduced-motion`, safe area no mobile.
- Acessibilidade: popover em `role=toolbar`, hover com foco equivalente, índice com lista navegável, vídeo com nome acessível, export com `aria-live` em sucesso/erro.

## Dependências

- BACKLOG-0013 promovido: motor Milkdown vigente, `MilkdownNoteEditor`, `MilkdownMobileToolbar`, slash e drawer 90dvh.
- SPEC-0004 Complete: fence `:::verse`, `VerseSelector`, índice `note_verse_ref`, H1↔YAML.
- SPEC-0003 Complete: catálogo e leitura OpenLP em `bibles/*.sqlite` para hover e export.
- Nova capacidade: parser de referências em texto livre, bloco de vídeo YouTube e geração PDF/Markdown.

## Situações de erro

- Sem Bíblia importada ou versão ausente: hover e export mostram aviso explícito sem inventar texto; bloco salvo mantém snapshot.
- Referência ambígua ou inválida: sem card, sem quebra da edição.
- URL inválida ou fora do YouTube: erro inline e bloco não inserido.
- Nota sem H1–H3: índice vazio com orientação.
- Falha ao exportar: erro explícito sem alterar o original e sem fingir sucesso.
- Workspace não pronto: mantém onboarding/permissão vigente.

## Escopo

- Dentro: popover de formatação; hover card de referências; índice dropdown desktop + drawer mobile; embed YouTube por URL ou slash; export PDF/Markdown com versos expandidos; opção de toolbar nas configurações da nota; fallbacks acima.
- Fora: construtor de sermões; mudança de fence `:::verse` e YAML; intervalo que atravessa capítulos; autenticação; colaboração; sincronização; outros provedores de vídeo.

## Dúvidas, decisões e riscos

- **Decidido:** agrupar os dois inbox num único item por pedido explícito de complemento. 2026-09-05.
- **Decidido Q1–Q8:** ver Comportamento esperado. 2026-09-05.
- **Suposição:** versão padrão = `openbible.default-bible-version` ou `readerSelection.versionId` quando o parser não traz versão; confirmar na spec.
- **Suposição:** botão de índice e botões de export ficam no header da nota `/notes/[id]`; confirmar composição na spec.
- **Risco:** parser de referências em texto livre, supressão do menu nativo e geração de PDF exigem prova técnica na spec.
- **Nenhuma lacuna aplicável aberta.** Limite de 8 perguntas respeitado.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Pronto para `$specsfy-03-specify`.

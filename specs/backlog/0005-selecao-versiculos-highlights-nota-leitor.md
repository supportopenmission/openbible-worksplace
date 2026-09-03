# Backlog: Seleção de versículos, highlights e nota no leitor

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0005 |
| Status | Promoted |
| Produto | OpenBible |
| Épico | Leitor da Bíblia |
| Funcionalidade | Seleção, highlight, copiar e criar nota a partir do reader |
| Tipo | Funcionalidade |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | `specs/draft/0005-selecao-versiculos-highlights-nota-leitor/spec.md` |
| Área em descoberta | P2 encerrada |
| Brief testável | Sim |

## Ideia original

quero trabalhar em feature na biblia (/bible):
- Funcionalidade de Selecionar versiculos um ou mais ao selecionar teremos a possibilidade de highlights, copiar (referencia e/ou texto + referencia), criar nota com o texto selecionado (ao criar a nota vai abrir a tela da biblai vai ficar com split view no desktop e com abas no mobile, de um lado a view do reader da biblia, de outro lado a pagina de criação da nota.
- O highlight deve funcionar semelhando ao highlighs do app da biblia logos com diversas opções de highlights veja a imagem. só que a ideia é ter um popover com as opcoes e a ideia é ter alem das cores opcoes de highligts com riscos e etc.

## Problema percebido

No leitor `/bible` a pessoa não consegue selecionar versículos para destacar, copiar ou criar nota sem abandonar a leitura.

## Pessoa afetada ou beneficiada

Pessoa usuária individual, sem conta, que lê a Bíblia e elabora os próprios estudos e notas no workspace local.

## Resultado ou valor esperado

Selecionar um ou mais versículos no reader e, no popover, destacar com cores e riscos, copiar referência e/ou texto+referência, e criar nota com o texto selecionado sem sair da Bíblia: split view no desktop e abas no mobile.

## Contexto

Fatia do leitor `/bible`. SPEC-0003 já entrega versão, livro, capítulo, leitura, busca e retomada; a Q4 dessa spec deixou destaques e notas para etapas posteriores. SPEC-0004 entregou notas File Over Apps com bloco `:::verse` e highlights TipTap do canvas — domínio distinto. O perfil do projeto já prevê SQLite local para índices e destaques. A UI de highlight no OpenBible é popover contextual, não o painel Highlighting permanente do Logos. Duas imagens de referência do Logos (João 15 e paleta Highlighter Pens / Inductive-Precept) foram anexadas ao pedido.

Checkout inspecionado em 2026-09-03: `BibleReader` renderiza `ol.verse-list` com número e texto, sem clique de seleção, popover, markup persistente ou split com nota. `note-editor-layout.ts` e `note-page-chrome.svelte.ts` controlam só a largura do canvas em `/notes/[id]`. Não há split view Bíblia+nota no shell.

## Referências relacionadas

- `specs/inbox/2026-09-02-223541-selecao-de-versiculos-highlights-e-nota-no-leitor-bible.md` — origem; não é duplicata.
- `specs/completed/0003-leitor-biblia-sqlite/spec.md` — spec relacionada: leitor `/bible` existe; Q4 excluiu destaques e notas.
- `specs/backlog/0003-leitor-biblia-sqlite.md` — backlog stub da spec já completed; não atualizar como se fosse o mesmo problema.
- `specs/completed/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo/spec.md` — spec relacionada: reutilizar criação de nota e fence `:::verse`; highlights do canvas (`==texto==`, cores amarelo/verde/azul/rosa) **não** são o markup do reader. Fora de escopo da 0004: “Comparação lado a lado de versões, destaques bíblicos e planos de leitura.”
- `specs/backlog/0004-notas-canvas-estilo-notion-com-bloco-de-versiculo.md` — backlog promovido da 0004; complementar, não duplicata.
- `specs/in-progress/0001-onboarding-configuracao-armazenamento/spec.md` — spec relacionada: workspace, `bibles/`, `.openbible/index.sqlite`.
- `PROJECT.md`, `.specsfy/USER-PROFILE.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md` — uso individual; Markdown fonte das notas; SQLite auxiliar para índices e destaques; `index.sqlite` hoje só tem `note_verse_ref`.
- `INTERFACE.md` — `BibleReader`, `BibleVerseList`, `Dialog`/`Sheet`, `Tabs`, `Notes` em `/notes` e `/notes/[id]`.
- `DESIGNSYSTEM.MD` — guideline Vercel, Geist, claro/escuro, sem cards/gradientes/glows.
- Imagens anexadas do Logos Bible Software — referência visual de estilos (canetas, caixas, riscos, nuvem) e de sobreposição bloco+palavra; **não** autorizam copiar o painel lateral permanente.

## Pesquisa de duplicatas

Não é duplicata. Nenhuma inbox, backlog ou spec cobre seleção de versículos no reader com highlight, copiar e criar nota em split/abas. A 0003 entrega o leitor sem markup. A 0004 entrega highlights do editor de notas.

## Vocabulário (MCR-10, análise silenciosa)

| Termo | Sentido neste item | Risco |
| --- | --- | --- |
| Highlight do reader | Anotação persistente com intervalo de versículos inteiros no capítulo e um estilo visual | Homônimo do highlight TipTap da nota; não é empilhamento de estilos numa única anotação |
| Intervalo de highlight | Faixa contínua `verseStart`–`verseEnd` no mesmo capítulo (ex.: Gn 1.3 ou Gn 1.2–5) | Decisão Q3; um versículo pode pertencer a mais de um intervalo |
| Sobreposição de intervalos | Duas anotações distintas cujos intervalos se intersectam (Gn 1.3 ∩ Gn 1.2–5) | Decisão Q3; **não** é fundo+sublinhado como um só markup |
| Empilhamento de estilos visuais | Vários traços visuais na mesma anotação (ex.: fundo e risco juntos) | Fora da Q3; não foi o que o usuário confirmou |
| Highlight da nota | Formatação `==texto==` no canvas TipTap (SPEC-0004) | Não reutilizar a paleta como contrato do reader |
| Seleção de leitura | Preferência `versionId`/`bookId`/`chapter` (SPEC-0003) | Homônimo da seleção de versículos |
| Seleção de versículos | Um ou mais versículos **inteiros** no capítulo aberto | Decisão Q1; trecho/palavra fora desta fatia |
| Texto selecionado | Texto completo do(s) versículo(s) escolhido(s), usado em copiar e na nota | Decisão Q1 |
| Popover | Superfície contextual ao selecionar; não painel lateral permanente | Declarado |
| Split view / abas | Desktop: reader + criação da nota lado a lado; mobile: abas reader e nota | Declarado |
| Independência highlight/nota | Destacar não cria nota; criar nota não aplica highlight; sem vínculo persistente | Decisão Q2 |

## Comportamento esperado

**Declaração do usuário:**

- Selecionar um ou mais versículos no `/bible`.
- Ao selecionar, oferecer highlights, copiar (referência e/ou texto + referência) e criar nota com o texto selecionado.
- Ao criar a nota, permanecer na Bíblia: split view no desktop e abas no mobile; de um lado o reader, do outro a criação da nota.
- Highlight semelhante ao Logos, com cores e opções de riscos etc., em popover (não painel permanente).

**Inferência (não confirmada):**

- O highlight do reader deve sobreviver à reabertura do capítulo e é domínio novo, persistido no SQLite auxiliar (`index.sqlite`), sem alterar os SQLite de `bibles/` nem o Markdown da nota.
- Criar nota a partir da seleção reutiliza o fluxo File Over Apps e o bloco `:::verse` já existente.
- A paleta visual inspira-se no Logos (canetas sólidas + riscos/caixas), mas a cromia e os tokens seguem o design system do OpenBible.

**Decisão Q1 (2026-09-02, opção 1 — não reabrir):** somente versículos inteiros (um ou mais no capítulo aberto). Highlight, copiar e nota valem para o versículo completo. Trecho, palavra e sobreposição palavra-dentro-de-bloco ficam para depois.

**Decisão Q2 (2026-09-02, opção 1 — não reabrir):** highlight e nota são independentes. Destacar não cria nota; criar nota não aplica highlight. A nota abre em split/abas com o texto e a referência dos versículos, sem vínculo persistente com um destaque.

**Decisão Q3 (2026-09-02 — não normalizar como empilhamento visual):** resposta original `2, pois pode haver um highligh com gn 1.3 e outro Gn 1.2-5`. Um highlight é uma **anotação com intervalo** de versículos inteiros. Intervalos podem coexistir e se sobrepor: Gn 1.3 e Gn 1.2–5 são duas anotações; Gn 1.3 participa das duas. Isto **não** significa vários estilos visuais (fundo + sublinhado) numa única anotação no mesmo versículo.

**Decisão Q4 (2026-09-02, opção 1 — não reabrir):** identidade pelo intervalo exato. Aplicar, trocar e apagar só a anotação cujo intervalo é exatamente a seleção. Selecionar Gn 1.3 não altera Gn 1.2–5. Cada anotação tem um estilo; o versículo mostra todos os intervalos que o cobrem.

**Decisão Q5 (2026-09-02, opção 1 — não reabrir):** a seleção é sempre um intervalo contínuo no capítulo (Gn 1.3 ou Gn 1.2–5). Para destacar 1.3 e 1.7, a pessoa cria duas anotações, uma de cada vez.

**Decisão Q6 (2026-09-02, opção 1 — não reabrir):** canetas de fundo sólido (conjunto pequeno de cores) mais três riscos: sublinhado, sublinhado ondulado e caixa. Inclui apagar. Nuvem/scalloped, strike-through, riscos duplos/tracejados e atalhos B/G/O/R/Y ficam para depois.

**Normalização do copiar (pedido original — não perguntar):** o popover oferece duas ações: copiar só a referência; copiar o texto dos versículos da seleção mais a referência. Não é um único botão ambíguo. Atalhos estilo Logos (B/G/O/R/Y) estão fora desta fatia (Q6).

**Aberto:** nenhuma lacuna P2 aplicável. P3 de atalhos Logos encerrada pela Q6 (fora de escopo).

## Regras de negócio

- **Declarado:** um ou mais alvos podem ser selecionados juntos; o popover oferece highlight, copiar e criar nota.
- **Declarado (perfil):** uso individual, sem conta; File Over Apps; SQLite local para destaques.
- **Declarado (SPEC-0003):** o texto bíblico em `bibles/*.sqlite` é somente leitura.
- **Decisão Q1:** o alvo é o versículo inteiro; um ou mais no **mesmo capítulo aberto**; sem seleção intra-versículo nesta fatia.
- **Decisão Q2:** highlight e nota não se criam nem se apagam juntos; a nota criada a partir da seleção não fica ligada a um destaque.
- **Decisão Q3:** o highlight é uma anotação identificada por um intervalo contínuo de versículos inteiros no capítulo; intervalos distintos podem se sobrepor; um versículo pode pertencer a mais de uma anotação. Não é empilhamento de estilos visuais numa só anotação.
- **Decisão Q4:** aplicar, trocar estilo e apagar só a anotação com o mesmo intervalo da seleção atual; cada anotação tem um estilo; o versículo na interseção exibe todos os intervalos que o cobrem.
- **Decisão Q5:** a seleção no reader é um único intervalo contínuo no capítulo aberto; não há seleção disjunta (1.3+1.7) nesta fatia.
- **Decisão Q6:** paleta desta fatia = canetas sólidas (conjunto pequeno) + sublinhado + sublinhado ondulado + caixa + apagar. Fora: nuvem, strike-through, duplo, tracejado, atalhos B/G/O/R/Y.
- **Normalização (pedido original):** duas ações de copiar no popover — referência; texto + referência.

## Critérios de aceitação

Rascunho não normativo (ainda depende das P2):

- Given um capítulo aberto no `/bible`, when a pessoa seleciona um ou mais versículos inteiros desse capítulo, then um popover oferece highlight, copiar e criar nota.
- Given essa seleção, when escolhe um estilo de highlight, then o markup cobre o versículo completo e permanece ao reabrir o capítulo.
- Given essa seleção, when copia referência ou texto+referência, then a área de transferência recebe o versículo completo (não um trecho interno).
- Given essa seleção, when cria nota, then o reader permanece visível (split no desktop, aba no mobile), a nota recebe o texto/referência dos versículos inteiros e **nenhum** highlight é aplicado por essa ação.
- Given a seleção contínua, when escolhe um estilo da paleta desta fatia, then a anotação usa uma caneta sólida ou um dos três riscos (sublinhado, ondulado, caixa); apagar remove só a anotação do intervalo exato.
- Given a seleção, when copia referência, then a área de transferência recebe a referência dos versículos. When copia texto e referência, then recebe o texto completo dos versículos mais a referência.

## Qualidades e operação

- Segurança: sem conta; nenhuma ação envia texto bíblico ou nota à rede.
- Privacidade: destaques e notas ficam no workspace local.
- Desempenho e volume: a avaliar (capítulo longo + N highlights).
- Auditoria e observabilidade: não aplicável no MVP local.
- Acessibilidade: teclado, foco visível, `prefers-reduced-motion`, tema claro/escuro; guideline Vercel / Geist.
- Interface: Svelte 5 + Tailwind + shadcn-svelte; sem React, shadcn/ui React ou ReUI.

## Dependências

- SPEC-0003: catálogo, capítulo e `BibleVerseList`.
- SPEC-0004: criar nota, fence `:::verse`, editor em `/notes/[id]`.
- Workspace e `index.sqlite` (0001 em andamento): persistência auxiliar; schema de destaques ainda não existe.
- Primitives já no mapa: `Dialog`, `Sheet`, `Tabs`, `Button`, `Tooltip`. Popover de seleção ainda não está em `INTERFACE.md`.

## Situações de erro

- A esclarecer: clipboard negado; workspace sem permissão de escrita; nenhuma versão importada; seleção inválida; falha ao criar o arquivo da nota.

## Escopo

- Dentro (declarado + Q1–Q6): `/bible`; seleção = intervalo contínuo; highlight = anotação de intervalo sobreponível com identidade exata; paleta = canetas sólidas + sublinhado + ondulado + caixa + apagar; duas ações de copiar; criar nota independente em split/abas.
- Fora: seleção disjunta; trecho/palavra; nuvem/strike/duplo/tracejado; atalhos B/G/O/R/Y; nota ancorada ao highlight; painel Logos permanente; marcas Vercel/Logos; highlight TipTap como markup do reader; travessar capítulos; sync remoto; alterar `bibles/*.sqlite`.

## Análise categorial (MCR-10, silêncio)

| Categoria | Status | Nota |
| --- | --- | --- |
| Substância | Definida (Q1+Q3) | Alvo da seleção = versículo inteiro; entidade de highlight = anotação com intervalo, não uma célula por versículo |
| Quantidade | Definida (Q3–Q5) | N intervalos sobreponíveis; cada seleção/anotação é contínua no capítulo; 1.3 e 1.7 = duas anotações |
| Qualidade | Definida (Q6) | Canetas sólidas (conjunto pequeno) + sublinhado, ondulado, caixa + apagar; cromia OpenBible |
| Relação | Definida (Q2+Q3) | Highlight ⟂ nota; anotações de intervalo podem intersectar |
| Lugar | Definida | `/bible`; popover; split desktop / abas mobile |
| Tempo | Inferida | Persistência entre sessões via SQLite de destaques (perfil) |
| Posição | Definida (Q4) | Aplicar/trocar/apagar só a anotação da seleção exata; versículo exibe todos os intervalos que o cobrem |
| Posse | Não aplicável | Uso individual local, sem papéis |
| Ação | Definida (Q1–Q6 + pedido) | Selecionar contínuo, destacar, apagar, copiar referência, copiar texto+referência, criar nota |
| Afecção | Definida | Intervalos persistidos; clipboard; nota nova sem highlight; Gn 1.3 não destrói Gn 1.2–5 |

## Dúvidas, decisões e riscos

### Decisões já aproveitadas (não perguntar de novo)

- Rota e superfície: `/bible` / `BibleReader`.
- Ações do popover: highlight, copiar referência e/ou texto+referência, criar nota.
- Layout ao criar nota: split desktop, abas mobile; reader de um lado, criação da nota do outro.
- Highlight em popover, não painel lateral permanente.
- Estilos: cores e riscos/caixas, inspirados no Logos, cromia OpenBible.
- Pessoa e persistência geral: individual; File Over Apps; SQLite para destaques; Markdown para a nota.
- Highlights do canvas (0004) permanecem domínio da nota.
- **Q1 (2026-09-02, opção 1):** somente versículos inteiros, um ou mais no capítulo aberto; highlight, copiar e nota valem para o versículo completo; trecho/palavra e sobreposição palavra-dentro-de-bloco ficam para depois. Não reabrir.
- **Q2 (2026-09-02, opção 1):** destacar não cria nota; criar nota não aplica highlight; a nota abre em split/abas com texto e referência, sem vínculo persistente com um destaque. Não reabrir.
- **Q3 (2026-09-02, texto `2, pois pode haver um highligh com gn 1.3 e outro Gn 1.2-5`):** highlight = anotação de intervalo; Gn 1.3 e Gn 1.2–5 coexistam e Gn 1.3 participa dos dois. **Não** é fundo+sublinhado na mesma anotação. Não reabrir essa distinção.
- **Q4 (2026-09-02, opção 1):** identidade pelo intervalo exato; aplicar, trocar e apagar só a anotação da seleção; Gn 1.3 não altera Gn 1.2–5; um estilo por anotação; o versículo mostra todos os intervalos que o cobrem. Não reabrir.
- **Q5 (2026-09-02, opção 1):** a seleção é sempre um intervalo contínuo no capítulo (Gn 1.3 ou Gn 1.2–5). Para destacar 1.3 e 1.7, cria duas anotações, uma de cada vez. Não reabrir.
- **Q6 (2026-09-02, opção 1):** canetas sólidas (conjunto pequeno) + sublinhado, ondulado e caixa + apagar. Fora: nuvem, strike-through, duplo, tracejado, atalhos B/G/O/R/Y. Não reabrir.

### Respostas da descoberta

| Rodada | Pergunta | Resposta original | Decisão normalizada | Efeito |
| --- | --- | --- | --- | --- |
| 1 | Qual é a unidade que a pessoa seleciona no leitor `/bible` nesta fatia? | `1` | Somente versículos inteiros (um ou mais no capítulo aberto). Highlight, copiar e nota valem para o versículo completo. Trecho/palavra e sobreposição palavra-dentro-de-bloco ficam para depois. | Fecha substância e tira offset intra-versículo do escopo; seleção não atravessa capítulos nesta fatia. |
| 2 | Qual é a relação entre o highlight e a nota criada a partir dos versículos selecionados? | `1` | Independentes: destacar não cria nota; criar nota não aplica highlight. A nota abre em split/abas com o texto e a referência dos versículos, sem vínculo persistente com um destaque. | Fecha relação; nota não ancora no markup; highlight tem ciclo de vida próprio. |
| 3 | Quando um versículo já está destacado, o que acontece se a pessoa aplica outro estilo ou quer tirar o markup? | `2, pois pode haver um highligh com gn 1.3 e outro Gn 1.2-5` | Coexistem anotações de **intervalo** que se sobrepõem (Gn 1.3 e Gn 1.2–5). Não é empilhamento visual de estilos (fundo + sublinhado) numa única anotação. | Entidade = intervalo; um versículo pode estar em N anotações. |
| 4 | Se Gn 1.3 já está num highlight só dele e também no intervalo Gn 1.2–5, o que o popover faz ao aplicar, trocar estilo ou apagar? | `1` | Identidade pelo intervalo exato: aplicar, trocar e apagar só a anotação cujo intervalo é exatamente a seleção. Selecionar Gn 1.3 não altera Gn 1.2–5. Cada anotação tem um estilo; o versículo mostra todos os intervalos que o cobrem. | Fecha posição/ação na interseção; Gn 1.3 não destrói Gn 1.2–5. |
| 5 | Nesta fatia, a pessoa pode selecionar versículos que não formam um intervalo contínuo (por exemplo Gn 1.3 e Gn 1.7, sem 1.4–6)? | `1` | Não: a seleção é sempre um intervalo contínuo no capítulo (Gn 1.3 ou Gn 1.2–5). Para destacar 1.3 e 1.7, cria duas anotações, uma de cada vez. | Fecha quantidade da seleção; anotações disjuntas só por ações sucessivas. |
| 6 | Quais estilos de highlight entram nesta fatia, no popover do OpenBible? | `1` | Canetas de fundo sólido (conjunto pequeno de cores) mais três riscos: sublinhado, sublinhado ondulado e caixa. Inclui apagar. Nuvem/scalloped, strike-through, riscos duplos/tracejados e atalhos B/G/O/R/Y ficam para depois. | Fecha qualidade da paleta; atalhos Logos saem do escopo. |
| — | Copiar (não perguntado) | Pedido original: `copiar (referencia e/ou texto + referencia)` | Duas ações no popover: copiar referência; copiar texto + referência. | Fecha a última P2 declarada no pedido. |

### Lacunas ordenadas por impacto × incerteza

Nenhuma lacuna P2 aplicável. P3 de atalhos Logos está fora de escopo (Q6).

### Riscos

- Tratar highlight do reader como highlight TipTap da nota.
- Normalizar a Q3 como empilhamento visual (fundo + risco).
- Copiar a paleta ou a marca do Logos (nuvem, painel permanente, atalhos B/G/O/R/Y) sem recorte desta fatia.
- Copiar a UI/marca da Vercel.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

Diagnóstico: Q1–Q6 fechadas; copiar normalizado do pedido original. P2 encerrada. Brief pronto para `$specsfy-03-specify`. Persistência de destaques já confirmada no perfil (SQLite auxiliar); a spec detalha a entidade de intervalo. Perfil de setup não alterado.

## Brief pronto para especificar

1. **Problema:** no `/bible` não dá para selecionar versículos e destacar, copiar ou criar nota sem sair da leitura.
2. **Atores:** pessoa usuária individual, local, sem conta.
3. **Escopo:** intervalo contínuo; anotações de highlight sobreponíveis com identidade exata; paleta Q6; copiar referência ou texto+referência; nota independente em split desktop / abas mobile. Fora: palavra, paleta Logos completa, atalhos B/G/O/R/Y, vínculo nota↔highlight.
4. **Jornadas:** selecionar contínuo → popover → destacar / copiar / criar nota; reabrir capítulo restaura intervalos; Gn 1.3 não altera Gn 1.2–5.
5. **Aceite:** Gherkin na spec (seleção, overlap, paleta, copiar, nota sem highlight, persistência).
6. **Restrições:** File Over Apps; `index.sqlite` para destaques; não alterar `bibles/*.sqlite`; Svelte 5 + shadcn-svelte; guideline Vercel/Geist; highlight do reader ≠ TipTap.
7. **Suposições:** 4–8 canetas nomeadas acessíveis; referência copiada com livro, capítulo, versículo(s) e versão; criar nota sempre gera nota nova com `:::verse`; persistir no SQLite auxiliar.
8. **Decisões abertas:** nenhuma P2 aplicável.
9. **Vocabulário:** highlight = anotação de intervalo, não empilhamento de estilos.

## Próximo passo

Transição automática: `$specsfy-02-backlog` → `$specsfy-03-specify`.

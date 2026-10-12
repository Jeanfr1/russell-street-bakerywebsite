# Antes da primeira mordida → Calor → Camadas

## Ação inicial

O ponto de vista é de dentro do forno. A pá/massas avança na direção do observador: escala 0,70→0,88 e deslocamento vertical 8→10vh na primeira parte. O fundo do forno se aproxima discretamente. As mãos do padeiro fazem parte da fotografia de fundo; a cena é uma composição 2.5D, não vídeo de atuação.

## Timeline

| Progresso | Cena | Comportamento |
| --- | --- | --- |
| 0–16% | Before the first bite | Padeiro, massas, título e CTAs; pá inicia avanço |
| 16–32% | Aproximação | Texto se afasta e perde opacidade; a pá conclui o movimento |
| 29–57% | The warmth between | Luz suave, fade do forno e entrada da cena creme |
| 40–60% | Match cut editorial | Croissant em camadas ganha presença; mudança de cor dos controles |
| 60–100% | A study in layers | Cinco partes se afastam ligeiramente; ingredientes têm movimento menor |

`motionAt(p)` em `08-estudo/portal.js` é a referência numérica. O estágio sticky ocupa uma tela; seção de 240vh no desktop e 205vh no mobile. Progresso: posição da seção dividida por sua altura útil de scroll, limitado entre zero e um. Navegação e CTAs continuam nativos.

## Mobile

Enquadrar o padeiro e as massas à direita/centro; texto embaixo. Croissant ampliado em faixa horizontal; seções e ingredientes com deslocamentos discretos. Manter labels curtos. Conferir mobile de 320, 390 e 430 px e tela baixa para evitar cortes.

## Acessibilidade

Com `prefers-reduced-motion`, manter a cena inicial estática e todas as ações disponíveis. O usuário pode reduzir o movimento manualmente. A cena de camadas é inerte e oculta da árvore acessível antes de aparecer. Sem som automático, scroll hijacking ou loops de fundo.

## Entrega

Os PNGs transparentes, máscaras e parâmetros estão no kit. A prévia MP4 mostra a narrativa por composição; não é uma captura do navegador. Um filme real do padeiro pode substituir a abertura no futuro, conservando a transição e o restante do percurso, mas não é necessário ao estudo entregue.

# Camadas do hero

`pa-e-massas.png`: três massas cruas e a lâmina da pá, com transparência verdadeira. Derivado da cena-mestre. A geração recompôs levemente os volumes e posições; a implementação usa escala e posição calibradas sobre o fundo. Não é uma extração pixel-perfeita.

`croissant-em-camadas.png`: cinco seções de um croissant de campanha, manteiga, farinha e trigo. A arte tem alfa. O estudo aplica máscaras CSS ao mesmo master para mover cada seção; os pixels do arquivo não são recortados nem regravados.

Máscaras de referência: ingredientes y=0–37%; cinco seções nos intervalos x=0–26,2%, 26,2–41,5%, 41,5–58,7%, 58,7–73%, 73–100%, com y=34–93%. Conferir as bordas no projeto final. Os limites estão em `07-integracao/coordenadas.json`.

Preservar os masters. Os JPEGs de maquete do hero contêm texto para apresentação; não servem como fundo único de um site funcional.

# Integração do estudo

`08-estudo/index.html`, `portal.css` e `portal.js` funcionam juntos sem servidor, com fontes locais. Caminhos relativos ao kit. Ajustar os caminhos ao framework de destino. Nenhum arquivo no estudo depende de um serviço pago de animação.

O JSON é documentação/dado editável, mas não é carregado automaticamente pelo estudo estático. Ao mudar endereço, horário ou textos, atualizar também o HTML ou integrar os dados ao renderizador final. Não criar checkout enquanto não houver infraestrutura e autorização para pedidos.

## Fotos reais

O contêiner `.source-frame` usa proporção do retângulo e largura/offsets da imagem original para esconder a UI sem regravar a fonte. A seleção usa duas regiões do screenshot do perfil para os produtos reais. Outras fotos aparecem no craft, story e visit. Conferir em cada breakpoint.

## Movimento

`motionAt()` retorna progresso, opacidades, escalas, deslocamentos e capítulo. Atualização por requestAnimationFrame, com scroll/resize passivos. A cena final é marcada inerte antes de aparecer. Movimento reduzido desativa a sequência e mantém a primeira cena e os links.

O croissant é um master com alfa; cinco máscaras CSS delimitam as partes. As peças se movem dentro do mesmo canvas. A pá é calibrada sobre o fundo: o gerador recompôs ligeiramente sua posição, portanto não é camada pixel-perfeita. Verificar encaixe e recortes na aplicação real.

## Controles

Menu mobile com aria-expanded, fechamento por Échap e retorno do foco. Filtros com aria-pressed e contagem anunciada. CTAs vão às seções, Instagram e mapa reais. Não exibir botões de pedido sem serviço funcional.

## Entrega ao repositório

Seguir IMPLEMENTACAO.md e o prompt. Preservar os masters, gerar cópias web otimizadas quando necessário e revisar o render real em navegador. As maquetes e a prévia são composições, não capturas de uma sessão de navegação. Nenhum site foi publicado.

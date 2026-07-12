# Organização dos estilos

- `core/`: fundação visual e estrutura compartilhada do site.
- `components/`: estilos de componentes reutilizáveis.
- `pages/`: estilos específicos de páginas ou conjuntos de páginas.
- `processes/`: estados e fluxos visuais assíncronos/interativos.
- `themes/`: variações e correções dos temas.
- `global.css`: índice ordenado de imports; não concentrar regras novas aqui.

A ordem dos imports em `global.css` preserva a cascata existente.

# Organização dos estilos

- `global.css`: importa somente fundação e layout realmente usados em todas as páginas.
- `core/`: tokens, reset, tipografia e estrutura global.
- `components/`: estilos importados pelo próprio componente Astro quando ele é utilizado.
- `pages/`: estilos importados somente pela página correspondente.
- `processes/`: estados e fluxos específicos, como publicação e lazy loading.
- `themes/`: compatibilidade temática importada apenas nas páginas que ainda usam esses componentes.

Evite adicionar CSS específico ao `global.css`. Prefira o import no componente ou na página proprietária do estilo.

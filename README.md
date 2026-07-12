# site-foto

Etapa atual: mensagens de foto unificadas em `murm_post`.

- comentário público: post `comment`, `visibility_code = public`;
- mensagem reservada ao proprietário: post `comment`, `visibility_code = private` e `recipient_user_id`;
- o Direct continua exclusivo para conversas privadas do chat;
- o patch incremental migra mensagens de foto que tenham sido colocadas no Direct e remove essa ligação.

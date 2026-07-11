#!/usr/bin/env bash
set -euo pipefail
rm -rf \
  murm-oracle \
  public/app.js \
  src/components/Composer.astro \
  src/components/Header.astro \
  src/lib/server/repositories/directs.ts \
  src/lib/server/repositories/posts.ts \
  src/pages/criar-conta.astro \
  src/pages/lembrar-senha.astro \
  src/pages/perfil.astro \
  src/pages/directs.astro \
  src/pages/api/directs \
  src/pages/api/posts \
  src/pages/api/replies \
  src/pages/api/auth/password.ts \
  src/pages/api/auth/profile.ts \
  src/pages/api/auth/reset-password.ts \
  src/pages/api/auth/signup.ts
printf 'Limpeza do site-foto concluída.\n'

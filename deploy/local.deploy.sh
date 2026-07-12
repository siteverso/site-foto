#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

echo "Projeto: $PROJECT_DIR"

if [ ! -f package.json ]; then
    echo "Erro: package.json não encontrado."
    exit 1
fi

echo "Configurando registro oficial do npm..."
npm config set registry https://registry.npmjs.org/

echo "Removendo instalações anteriores..."
rm -rf node_modules
rm -rf .astro
rm -rf dist
rm -rf node_modules/.vite

if [ -f package-lock.json ]; then
    echo "Instalando dependências pelo package-lock.json..."
    npm ci
else
    echo "package-lock.json não encontrado. Executando npm install..."
    npm install
fi

echo "Executando testes..."
npm test -- --run

echo "Gerando build..."
npm run build

echo
echo "Deploy local concluído."
echo "Agora execute:"
echo "./deploy/local.run.sh"
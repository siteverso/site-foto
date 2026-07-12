#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

if [ ! -f package.json ]; then
    echo "Erro: package.json não encontrado."
    exit 1
fi

if [ ! -d node_modules ]; then
    echo "Erro: dependências não instaladas."
    echo "Execute primeiro:"
    echo "./deploy/local.deploy.sh"
    exit 1
fi

if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

PORT="${DEV_PORT:-4322}"

echo "Iniciando site-foto..."
echo "Endereço: http://localhost:${PORT}"
echo

exec npm run dev -- --host 0.0.0.0 --port "$PORT"
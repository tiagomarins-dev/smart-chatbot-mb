#!/usr/bin/env sh
#
# Script para baixar phoenix.min.css localmente para protótipos
#
URL="https://prium.github.io/phoenix/v1.22.0/dist/css/phoenix.min.css"
DEST_DIR="$(dirname "${0}")"
TARGET="${DEST_DIR}/phoenix.min.css"

echo "Baixando Phoenix CSS de ${URL}..."
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "${URL}" -o "${TARGET}"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "${TARGET}" "${URL}"
else
  echo "Erro: instale curl ou wget para baixar." >&2
  exit 1
fi

if [ -s "${TARGET}" ]; then
  echo "Download concluído: ${TARGET}"
  exit 0
else
  echo "Falha no download. Verifique a URL e a conexão." >&2
  exit 1
fi

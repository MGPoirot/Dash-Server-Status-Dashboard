#!/bin/sh
set -e
echo "[start-prod] Running Gatsby build..."
if gatsby build; then
  echo "[start-prod] Build succeeded."
else
  echo "[start-prod] Build FAILED — serving previous build."
fi
echo "[start-prod] Starting Gatsby serve..."
gatsby serve -H 0.0.0.0

#!/bin/bash
# Compile the pwa-forge accessibility helper.
# Re-run after editing main.swift. The binary is per-machine — it is gitignored.
set -euo pipefail
cd "$(dirname "$0")"
swiftc -O main.swift -o pwa-forge
echo "built: $(pwd)/pwa-forge"
./pwa-forge check

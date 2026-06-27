#!/bin/bash
# ============================================================
# clean-dev.sh — Remove local Docker dev data before pushing
# ============================================================
# Usage: bash scripts/clean-dev.sh

echo "Cleaning dev data..."

rm -rf dev-data/
rm -rf dev-uploads/
rm -f aquila.json
rm -f data-persist/event-config.json
rm -f flag_calc.txt
rm -f flag_xxe.txt
rm -f ping_sandbox/flag_ping.txt

echo "Done. Safe to push."
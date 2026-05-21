#!/bin/bash

export PATH="/Users/melfredbernabe/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

echo ""
echo "=== LINGAP Soroban Deployment Cost Estimator ==="
echo ""

for wasm in donation_vault aid_provenance beneficiary_registry; do
  path="target/wasm32v1-none/release/${wasm}.wasm"
  echo -n "Simulating $wasm ... "
  XDR=$(/Users/melfredbernabe/.cargo/bin/stellar contract upload --wasm "$path" --source deployer --network testnet --build-only 2>/dev/null)
  if [ -z "$XDR" ]; then echo "failed"; continue; fi
  RESP=$(/usr/bin/curl -s https://soroban-testnet.stellar.org -X POST -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"simulateTransaction\",\"params\":{\"transaction\":\"$XDR\"}}")
  RAW=$(echo "$RESP" | /opt/homebrew/bin/python3.11 -c "import sys,json; r=json.load(sys.stdin); print(r['result']['minResourceFee'])" 2>/dev/null)
  if [ -z "$RAW" ]; then echo "RPC error"; continue; fi
  XLM=$(/opt/homebrew/bin/python3.11 -c "print($RAW / 10000000)")
  echo "$RAW stroops = $XLM XLM"
done

echo ""
echo "-------------------------------------------"
echo "Simulation network   : Stellar Testnet"
echo "Target network       : Stellar Mainnet"
echo "Recommended to send  : 50 XLM (mainnet fees + account reserve)"
echo ""
echo "Deployer wallet (Stellar Mainnet only):"
echo "GBAP6LPRSHQTZT66EBZ7IAJ6HQTSFFW4GVSMKMBOIZ3XM6FNABICFYAR"
echo ""
echo "Send only XLM (native asset) on Stellar Mainnet."
echo ""

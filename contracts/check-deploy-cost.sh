#!/bin/bash
for wasm in donation_vault aid_provenance beneficiary_registry; do
  path="target/wasm32v1-none/release/${wasm}.wasm"
  XDR=$(stellar contract upload --wasm "$path" --source deployer --network mainnet --build-only 2>/dev/null)
  if [ -z "$XDR" ]; then
    echo "$wasm : failed to build XDR"
    continue
  fi
  RESP=$(curl -s https://mainnet.sorobanrpc.com -X POST -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"simulateTransaction\",\"params\":{\"transaction\":\"$XDR\"}}")
  RAW=$(echo "$RESP" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['result']['minResourceFee'])" 2>/dev/null)
  if [ -z "$RAW" ]; then
    echo "$wasm : RPC error — $(echo "$RESP" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('error', r))" 2>/dev/null)"
    continue
  fi
  FEE=$(python3 -c "print($RAW / 10000000)")
  echo "$wasm : $RAW stroops = $FEE XLM"
done

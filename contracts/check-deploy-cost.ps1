foreach ($wasm in 'donation_vault','aid_provenance','beneficiary_registry') {
    $path = "target/wasm32v1-none/release/$wasm.wasm"
    $XDR = (stellar contract upload --wasm $path --source lingap --network mainnet --build-only) 2>$null
    $body = @{ jsonrpc='2.0'; id=1; method='simulateTransaction'; params=@{ transaction=$XDR } } | ConvertTo-Json -Compress
    $resp = Invoke-RestMethod -Uri https://mainnet.sorobanrpc.com -Method POST -ContentType 'application/json' -Body $body
    $fee = [decimal]$resp.result.minResourceFee / 10000000
    Write-Output "$wasm : $($resp.result.minResourceFee) stroops = $fee XLM"
}

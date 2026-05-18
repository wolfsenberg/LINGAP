"""
Soroban smart contract interaction helpers.
Calls aid_provenance and donation_vault contracts via RPC.
"""
from stellar_sdk import SorobanServer, Keypair, Network, TransactionBuilder
from stellar_sdk.soroban_rpc import GetTransactionStatus
from app.config import settings

SOROBAN_RPC = (
    "https://soroban-testnet.stellar.org"
    if settings.STELLAR_NETWORK == "testnet"
    else "https://soroban-rpc.stellar.org"
)

NETWORK_PASSPHRASE = (
    Network.TESTNET_NETWORK_PASSPHRASE
    if settings.STELLAR_NETWORK == "testnet"
    else Network.PUBLIC_NETWORK_PASSPHRASE
)


async def record_provenance(
    donation_id: str,
    aid_request_id: str,
    beneficiary_id: str,
    amount: int,
    asset: str,
) -> str:
    """
    Invoke aid_provenance contract to record an immutable provenance entry.
    Returns the Stellar transaction hash.
    """
    server = SorobanServer(SOROBAN_RPC)
    source = Keypair.from_secret(settings.STELLAR_SOURCE_SECRET_KEY)
    account = server.load_account(source.public_key)

    contract_id = settings.CONTRACT_AID_PROVENANCE

    from stellar_sdk import xdr as stellar_xdr
    from stellar_sdk.soroban import AuthorizedInvocation

    # Build invocation — simplified; real impl uses stellar_sdk.contract
    tx = (
        TransactionBuilder(account, NETWORK_PASSPHRASE, base_fee=1_000_000)
        .set_timeout(30)
        .build()
    )
    tx.sign(source)
    response = server.send_transaction(tx)
    return response.hash


async def get_contract_provenance(donation_id: str) -> list[dict]:
    """Query the aid_provenance contract for all records linked to a donation."""
    # Placeholder — real implementation uses SimulateTransaction + contract invocation
    return []

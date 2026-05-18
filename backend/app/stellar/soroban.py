"""
Soroban milestone escrow contract interaction.
Contract: CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP
"""
import time
from stellar_sdk import SorobanServer, Keypair, Network, TransactionBuilder, scval
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
CONTRACT_ID = settings.CONTRACT_DONATION_VAULT


def _server() -> SorobanServer:
    return SorobanServer(SOROBAN_RPC)


def _admin() -> Keypair:
    return Keypair.from_secret(settings.STELLAR_SOURCE_SECRET_KEY)


def _poll(server: SorobanServer, tx_hash: str, retries: int = 12) -> str:
    for _ in range(retries):
        time.sleep(2)
        resp = server.get_transaction(tx_hash)
        if resp.status == GetTransactionStatus.SUCCESS:
            return tx_hash
        if resp.status == GetTransactionStatus.FAILED:
            raise RuntimeError(f"Transaction failed: {tx_hash}")
    raise TimeoutError(f"Transaction {tx_hash} not confirmed after {retries * 2}s")


def _invoke_admin(function_name: str, args: list) -> str:
    """Build, sign as admin, and submit a write contract call. Returns tx hash."""
    server = _server()
    admin = _admin()
    account = server.load_account(admin.public_key)

    tx = (
        TransactionBuilder(account, NETWORK_PASSPHRASE, base_fee=1_000_000)
        .append_invoke_contract_function_op(
            contract_id=CONTRACT_ID,
            function_name=function_name,
            parameters=args,
        )
        .set_timeout(30)
        .build()
    )
    prepared = server.prepare_transaction(tx)
    prepared.sign(admin)
    response = server.send_transaction(prepared)
    return _poll(server, response.hash)


# ── Donor flow (unsigned XDR → Freighter signs → submit) ─────────────────────

async def build_deposit_xdr(campaign_id: int, donor_public_key: str, amount_stroops: int) -> str:
    """
    Build an unsigned deposit transaction XDR.
    The donor's Freighter wallet must sign this before it can be submitted.
    amount_stroops: token amount in stroops (1 XLM = 10_000_000).
    """
    server = _server()
    account = server.load_account(donor_public_key)

    tx = (
        TransactionBuilder(account, NETWORK_PASSPHRASE, base_fee=1_000_000)
        .append_invoke_contract_function_op(
            contract_id=CONTRACT_ID,
            function_name="deposit",
            parameters=[
                scval.to_uint64(campaign_id),
                scval.to_address(donor_public_key),
                scval.to_int128(amount_stroops),
            ],
        )
        .set_timeout(30)
        .build()
    )
    prepared = server.prepare_transaction(tx)
    return prepared.to_xdr()


async def submit_signed_xdr(signed_xdr: str) -> str:
    """Submit a Freighter-signed XDR envelope. Returns the confirmed tx hash."""
    from stellar_sdk import TransactionEnvelope
    server = _server()
    tx = TransactionEnvelope.from_xdr(signed_xdr, network_passphrase=NETWORK_PASSPHRASE)
    response = server.send_transaction(tx)
    return _poll(server, response.hash)


# ── Admin milestone flow ──────────────────────────────────────────────────────

async def admin_verify_milestone(campaign_id: int) -> str:
    """Admin: mark the current milestone as verified (documents checked)."""
    return _invoke_admin("verify_milestone", [scval.to_uint64(campaign_id)])


async def admin_release_milestone(campaign_id: int) -> str:
    """Admin: release funds for the current verified milestone to its recipient."""
    return _invoke_admin("release_milestone", [scval.to_uint64(campaign_id)])


async def admin_pause_campaign(campaign_id: int) -> str:
    """Admin: pause a campaign (e.g. fraud suspected)."""
    return _invoke_admin("pause_campaign", [scval.to_uint64(campaign_id)])


async def admin_unpause_campaign(campaign_id: int) -> str:
    """Admin: unpause a campaign."""
    return _invoke_admin("unpause_campaign", [scval.to_uint64(campaign_id)])


# ── Read-only queries ─────────────────────────────────────────────────────────

async def query_campaign(campaign_id: int) -> dict:
    """Simulate get_campaign and return the raw result XDR."""
    server = _server()
    admin = _admin()
    account = server.load_account(admin.public_key)

    tx = (
        TransactionBuilder(account, NETWORK_PASSPHRASE, base_fee=1_000_000)
        .append_invoke_contract_function_op(
            contract_id=CONTRACT_ID,
            function_name="get_campaign",
            parameters=[scval.to_uint64(campaign_id)],
        )
        .set_timeout(30)
        .build()
    )
    sim = server.simulate_transaction(tx)
    if not sim.results:
        raise ValueError("No result from contract query")
    return {"campaign_id": campaign_id, "result_xdr": sim.results[0].xdr}


async def query_campaign_count() -> int:
    """Return total number of campaigns."""
    server = _server()
    admin = _admin()
    account = server.load_account(admin.public_key)

    tx = (
        TransactionBuilder(account, NETWORK_PASSPHRASE, base_fee=1_000_000)
        .append_invoke_contract_function_op(
            contract_id=CONTRACT_ID,
            function_name="campaign_count",
            parameters=[],
        )
        .set_timeout(30)
        .build()
    )
    sim = server.simulate_transaction(tx)
    if not sim.results:
        return 0
    from stellar_sdk import xdr as stellar_xdr
    val = stellar_xdr.SCVal.from_xdr(sim.results[0].xdr)
    return val.u64 or 0

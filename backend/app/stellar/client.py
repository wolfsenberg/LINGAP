from stellar_sdk import Server, Network, Keypair, TransactionBuilder, Asset
from app.config import settings

NETWORK_PASSPHRASE = (
    Network.TESTNET_NETWORK_PASSPHRASE
    if settings.STELLAR_NETWORK == "testnet"
    else Network.PUBLIC_NETWORK_PASSPHRASE
)

horizon = Server(settings.STELLAR_HORIZON_URL)


def get_source_keypair() -> Keypair:
    return Keypair.from_secret(settings.STELLAR_SOURCE_SECRET_KEY)


async def verify_transaction(tx_hash: str) -> dict:
    tx = horizon.transactions().transaction(tx_hash).call()
    return {
        "confirmed": tx.get("successful", False),
        "ledger": tx.get("ledger"),
        "fee_charged": tx.get("fee_charged"),
        "created_at": tx.get("created_at"),
    }


async def send_payment(
    destination: str,
    amount: str,
    asset_code: str = "XLM",
    memo: str | None = None,
) -> str:
    source = get_source_keypair()
    source_account = horizon.load_account(source.public_key)

    asset = Asset.native() if asset_code == "XLM" else Asset(asset_code, source.public_key)

    builder = TransactionBuilder(
        source_account=source_account,
        network_passphrase=NETWORK_PASSPHRASE,
        base_fee=100,
    )
    builder.append_payment_op(destination=destination, asset=asset, amount=amount)
    if memo:
        builder.add_text_memo(memo)
    builder.set_timeout(180)

    tx = builder.build()
    tx.sign(source)
    response = horizon.submit_transaction(tx)
    return response["hash"]


async def get_account_info(public_key: str) -> dict:
    account = horizon.accounts().account_id(public_key).call()
    xlm_balance = next(
        (b["balance"] for b in account["balances"] if b["asset_type"] == "native"), "0"
    )
    return {"balance": xlm_balance, "sequence": account["sequence"]}

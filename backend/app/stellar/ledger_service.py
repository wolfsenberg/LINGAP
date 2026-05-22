from app.models.balance_transaction import BalanceTransaction


async def record_top_up(transaction: BalanceTransaction) -> None:
    # TODO: Replace this demo ledger hook with a Soroban top-up mirror once the
    # balance contract method is deployed.
    return None


async def record_donation(transaction: BalanceTransaction) -> None:
    # TODO: Replace this demo ledger hook with the donation vault lock call once
    # the Soroban campaign-vault method accepts off-ramp funded balances.
    return None

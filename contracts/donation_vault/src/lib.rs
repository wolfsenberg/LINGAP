#![no_std]

//! Donation Vault — holds donated funds and releases them only through
//! authorized disbursements approved by the LINGAP admin.

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, Env, Symbol, symbol_short,
};

const ADMIN:   Symbol = symbol_short!("ADMIN");
const TOKEN:   Symbol = symbol_short!("TOKEN");
const BALANCE: Symbol = symbol_short!("BALANCE");

#[contract]
pub struct DonationVaultContract;

#[contractimpl]
impl DonationVaultContract {
    /// Initialize with admin address and accepted token contract.
    pub fn initialize(env: Env, admin: Address, token_address: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&TOKEN, &token_address);
        env.storage().instance().set(&BALANCE, &0i128);
    }

    /// Donor calls this to deposit tokens into the vault.
    pub fn deposit(env: Env, donor: Address, amount: i128) {
        donor.require_auth();
        assert!(amount > 0, "amount must be positive");

        let token_addr: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        let balance: i128 = env.storage().instance().get(&BALANCE).unwrap_or(0);
        env.storage().instance().set(&BALANCE, &(balance + amount));
    }

    /// Admin-only: release funds to a beneficiary wallet.
    pub fn disburse(env: Env, recipient: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
        assert!(amount > 0, "amount must be positive");

        let balance: i128 = env.storage().instance().get(&BALANCE).unwrap_or(0);
        assert!(balance >= amount, "insufficient vault balance");

        let token_addr: Address = env.storage().instance().get(&TOKEN).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &recipient, &amount);

        env.storage().instance().set(&BALANCE, &(balance - amount));
    }

    pub fn vault_balance(env: Env) -> i128 {
        env.storage().instance().get(&BALANCE).unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).unwrap()
    }
}

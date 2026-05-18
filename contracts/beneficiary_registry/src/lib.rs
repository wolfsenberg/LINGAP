#![no_std]

//! Beneficiary Registry — stores on-chain verification status and
//! lifetime aid received per beneficiary, keyed by their Stellar address.

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Bytes, Env, Symbol, symbol_short,
};

#[contracttype]
#[derive(Clone)]
pub struct BeneficiaryEntry {
    pub beneficiary_id: Bytes,
    pub wallet:         Address,
    pub verified:       bool,
    pub total_received: i128,
    pub registered_at:  u64,
}

const ADMIN:      Symbol = symbol_short!("ADMIN");
const REG_COUNT:  Symbol = symbol_short!("COUNT");

fn entry_key(wallet: &Address) -> (Symbol, Address) {
    (symbol_short!("ENTRY"), wallet.clone())
}

#[contract]
pub struct BeneficiaryRegistryContract;

#[contractimpl]
impl BeneficiaryRegistryContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&REG_COUNT, &0u64);
    }

    /// Register a new beneficiary (admin only).
    pub fn register(env: Env, beneficiary_id: Bytes, wallet: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let key = entry_key(&wallet);
        assert!(!env.storage().persistent().has(&key), "already registered");

        let entry = BeneficiaryEntry {
            beneficiary_id,
            wallet: wallet.clone(),
            verified: false,
            total_received: 0,
            registered_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&key, &entry);

        let count: u64 = env.storage().instance().get(&REG_COUNT).unwrap_or(0);
        env.storage().instance().set(&REG_COUNT, &(count + 1));
    }

    /// Verify a registered beneficiary (admin only).
    pub fn verify(env: Env, wallet: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let key = entry_key(&wallet);
        let mut entry: BeneficiaryEntry = env.storage().persistent().get(&key).expect("not found");
        entry.verified = true;
        env.storage().persistent().set(&key, &entry);
    }

    /// Called by DonationVault after a disbursement to update totals.
    pub fn record_receipt(env: Env, wallet: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let key = entry_key(&wallet);
        let mut entry: BeneficiaryEntry = env.storage().persistent().get(&key).expect("not found");
        entry.total_received += amount;
        env.storage().persistent().set(&key, &entry);
    }

    pub fn get_entry(env: Env, wallet: Address) -> BeneficiaryEntry {
        env.storage()
            .persistent()
            .get(&entry_key(&wallet))
            .expect("beneficiary not found")
    }

    pub fn total_registered(env: Env) -> u64 {
        env.storage().instance().get(&REG_COUNT).unwrap_or(0)
    }
}

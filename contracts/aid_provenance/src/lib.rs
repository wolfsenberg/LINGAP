#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Bytes, BytesN, Env, Map, Vec, Symbol, symbol_short,
};

/// On-chain record of a single aid disbursement.
#[contracttype]
#[derive(Clone)]
pub struct ProvenanceRecord {
    pub donation_id:    Bytes,
    pub aid_request_id: Bytes,
    pub beneficiary_id: Bytes,
    pub recipient:      Address,
    pub amount:         i128,
    pub asset:          Symbol,
    pub timestamp:      u64,
}

const RECORDS:   Symbol = symbol_short!("RECORDS");
const ADMIN:     Symbol = symbol_short!("ADMIN");
const REC_COUNT: Symbol = symbol_short!("COUNT");

#[contract]
pub struct AidProvenanceContract;

#[contractimpl]
impl AidProvenanceContract {
    /// One-time initializer — sets the contract admin.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&REC_COUNT, &0u64);
    }

    /// Record a new provenance entry. Only callable by admin.
    pub fn record(
        env:            Env,
        donation_id:    Bytes,
        aid_request_id: Bytes,
        beneficiary_id: Bytes,
        recipient:      Address,
        amount:         i128,
        asset:          Symbol,
    ) -> u64 {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let count: u64 = env.storage().instance().get(&REC_COUNT).unwrap_or(0);
        let record = ProvenanceRecord {
            donation_id,
            aid_request_id,
            beneficiary_id,
            recipient,
            amount,
            asset,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&count, &record);
        env.storage().instance().set(&REC_COUNT, &(count + 1));

        count
    }

    /// Retrieve a provenance record by index.
    pub fn get_record(env: Env, index: u64) -> ProvenanceRecord {
        env.storage()
            .persistent()
            .get(&index)
            .expect("record not found")
    }

    /// Total number of records stored.
    pub fn count(env: Env) -> u64 {
        env.storage().instance().get(&REC_COUNT).unwrap_or(0)
    }

    /// Fetch the last N records (up to 50).
    pub fn recent(env: Env, n: u32) -> Vec<ProvenanceRecord> {
        let count: u64 = env.storage().instance().get(&REC_COUNT).unwrap_or(0);
        let n = (n as u64).min(50).min(count);
        let mut out = Vec::new(&env);
        for i in (count - n)..count {
            let rec: ProvenanceRecord = env.storage().persistent().get(&i).unwrap();
            out.push_back(rec);
        }
        out
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, Bytes, symbol_short};

    #[test]
    fn test_record_and_retrieve() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, AidProvenanceContract);
        let client = AidProvenanceContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let recipient = Address::generate(&env);
        let idx = client.record(
            &Bytes::from_slice(&env, b"donation-001"),
            &Bytes::from_slice(&env, b"request-001"),
            &Bytes::from_slice(&env, b"beneficiary-001"),
            &recipient,
            &10_000_000i128,
            &symbol_short!("XLM"),
        );

        assert_eq!(idx, 0);
        assert_eq!(client.count(), 1);

        let rec = client.get_record(&0);
        assert_eq!(rec.amount, 10_000_000i128);
    }
}

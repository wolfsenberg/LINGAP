#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    CampaignCount,
    Campaign(u64),
    Milestone(u64, u32),       // (campaign_id, milestone_index)
    DonorDeposit(u64, Address), // (campaign_id, donor) -> i128
    DonorList(u64),            // campaign_id -> Vec<Address>
    PauseVote(u64, Address),   // (campaign_id, donor) -> bool (has active vote)
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Verified,
    Released,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub amount: i128,
    pub status: MilestoneStatus,
    pub recipient: Address,
    pub description: String,
}

#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub organizer: Address,
    pub total_deposited: i128,
    pub total_released: i128,
    pub milestone_count: u32,
    pub current_milestone: u32,
    pub paused: bool,
    pub pause_vote_weight: i128,
    pub clawback_executed: bool,
}

// Pause threshold: 60% of total deposited weight must vote.
const PAUSE_THRESHOLD_PCT: i128 = 60;

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct DonationVaultContract;

#[contractimpl]
impl DonationVaultContract {

    pub fn initialize(env: Env, admin: Address, token_address: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token_address);
        env.storage().instance().set(&DataKey::CampaignCount, &0u64);
    }

    // ── Campaign management ─────────────────────────────────────────────────

    pub fn create_campaign(
        env: Env,
        organizer: Address,
        milestone_amounts: soroban_sdk::Vec<i128>,
        milestone_recipients: soroban_sdk::Vec<Address>,
        milestone_descs: soroban_sdk::Vec<String>,
    ) -> u64 {
        organizer.require_auth();

        let n = milestone_amounts.len();
        assert!(n > 0, "at least one milestone required");
        assert!(
            milestone_recipients.len() == n && milestone_descs.len() == n,
            "milestone arrays must have equal length"
        );

        let campaign_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);

        let campaign = Campaign {
            organizer: organizer.clone(),
            total_deposited: 0,
            total_released: 0,
            milestone_count: n,
            current_milestone: 0,
            paused: false,
            pause_vote_weight: 0,
            clawback_executed: false,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        for i in 0..n {
            let milestone = Milestone {
                amount: milestone_amounts.get(i).unwrap(),
                status: MilestoneStatus::Pending,
                recipient: milestone_recipients.get(i).unwrap(),
                description: milestone_descs.get(i).unwrap(),
            };
            env.storage()
                .persistent()
                .set(&DataKey::Milestone(campaign_id, i), &milestone);
        }

        env.storage()
            .instance()
            .set(&DataKey::CampaignCount, &(campaign_id + 1));

        campaign_id
    }

    // ── Funding ─────────────────────────────────────────────────────────────

    pub fn deposit(env: Env, campaign_id: u64, donor: Address, amount: i128) {
        donor.require_auth();
        assert!(amount > 0, "amount must be positive");

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        assert!(!campaign.paused, "campaign is paused");
        assert!(!campaign.clawback_executed, "clawback already executed");

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        // Track per-donor deposit for proportional clawback.
        let prev: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::DonorDeposit(campaign_id, donor.clone()))
            .unwrap_or(0);

        if prev == 0 {
            let mut list: Vec<Address> = env
                .storage()
                .persistent()
                .get(&DataKey::DonorList(campaign_id))
                .unwrap_or(Vec::new(&env));
            list.push_back(donor.clone());
            env.storage()
                .persistent()
                .set(&DataKey::DonorList(campaign_id), &list);
        }

        env.storage()
            .persistent()
            .set(&DataKey::DonorDeposit(campaign_id, donor.clone()), &(prev + amount));

        campaign.total_deposited += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // ── Milestone lifecycle ─────────────────────────────────────────────────

    pub fn verify_milestone(env: Env, campaign_id: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        assert!(!campaign.paused, "campaign is paused");
        assert!(
            campaign.current_milestone < campaign.milestone_count,
            "all milestones already released"
        );

        let idx = campaign.current_milestone;
        let mut milestone: Milestone = env
            .storage()
            .persistent()
            .get(&DataKey::Milestone(campaign_id, idx))
            .expect("milestone not found");

        assert!(
            milestone.status == MilestoneStatus::Pending,
            "milestone already verified or released"
        );

        milestone.status = MilestoneStatus::Verified;
        env.storage()
            .persistent()
            .set(&DataKey::Milestone(campaign_id, idx), &milestone);
    }

    pub fn release_milestone(env: Env, campaign_id: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        assert!(!campaign.paused, "campaign is paused");
        assert!(
            campaign.current_milestone < campaign.milestone_count,
            "all milestones already released"
        );

        let idx = campaign.current_milestone;
        let mut milestone: Milestone = env
            .storage()
            .persistent()
            .get(&DataKey::Milestone(campaign_id, idx))
            .expect("milestone not found");

        assert!(
            milestone.status == MilestoneStatus::Verified,
            "milestone must be verified before releasing"
        );

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &milestone.recipient,
            &milestone.amount,
        );

        campaign.total_released += milestone.amount;

        milestone.status = MilestoneStatus::Released;
        env.storage()
            .persistent()
            .set(&DataKey::Milestone(campaign_id, idx), &milestone);

        campaign.current_milestone += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // ── Admin pause / unpause ───────────────────────────────────────────────

    pub fn pause_campaign(env: Env, campaign_id: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        campaign.paused = true;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    pub fn unpause_campaign(env: Env, campaign_id: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        campaign.paused = false;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // ── Donor voting ────────────────────────────────────────────────────────

    /// Donor casts a vote to pause a suspicious campaign.
    /// Vote weight = donor's total deposited amount.
    /// Auto-pauses the campaign when cumulative weight >= 60% of total_deposited.
    pub fn vote_pause(env: Env, campaign_id: u64, donor: Address) {
        donor.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        assert!(!campaign.clawback_executed, "clawback already executed");

        let donor_deposit: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::DonorDeposit(campaign_id, donor.clone()))
            .unwrap_or(0);
        assert!(donor_deposit > 0, "must have deposited to vote");

        let already_voted: bool = env
            .storage()
            .persistent()
            .get(&DataKey::PauseVote(campaign_id, donor.clone()))
            .unwrap_or(false);
        assert!(!already_voted, "already voted");

        env.storage()
            .persistent()
            .set(&DataKey::PauseVote(campaign_id, donor.clone()), &true);

        campaign.pause_vote_weight += donor_deposit;

        // Auto-pause when threshold is reached.
        if campaign.total_deposited > 0
            && campaign.pause_vote_weight * 100
                >= campaign.total_deposited * PAUSE_THRESHOLD_PCT
        {
            campaign.paused = true;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    /// Donor retracts their pause vote.
    /// If vote weight drops below the threshold the campaign is unpaused.
    pub fn revoke_vote(env: Env, campaign_id: u64, donor: Address) {
        donor.require_auth();

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        assert!(!campaign.clawback_executed, "clawback already executed");

        let already_voted: bool = env
            .storage()
            .persistent()
            .get(&DataKey::PauseVote(campaign_id, donor.clone()))
            .unwrap_or(false);
        assert!(already_voted, "no active vote to revoke");

        let donor_deposit: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::DonorDeposit(campaign_id, donor.clone()))
            .unwrap_or(0);

        env.storage()
            .persistent()
            .remove(&DataKey::PauseVote(campaign_id, donor.clone()));

        campaign.pause_vote_weight -= donor_deposit;

        // Lift the donor-driven pause if weight drops below threshold.
        if campaign.total_deposited > 0
            && campaign.pause_vote_weight * 100
                < campaign.total_deposited * PAUSE_THRESHOLD_PCT
        {
            campaign.paused = false;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // ── Clawback ────────────────────────────────────────────────────────────

    /// Executes a proportional refund of unspent escrow funds to all donors.
    /// Requires: campaign paused AND vote weight >= 60% threshold.
    pub fn execute_clawback(env: Env, campaign_id: u64) {
        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        assert!(campaign.paused, "campaign must be paused to clawback");
        assert!(!campaign.clawback_executed, "clawback already executed");
        assert!(
            campaign.total_deposited > 0
                && campaign.pause_vote_weight * 100
                    >= campaign.total_deposited * PAUSE_THRESHOLD_PCT,
            "insufficient vote weight for clawback"
        );

        let remaining = campaign.total_deposited - campaign.total_released;
        assert!(remaining > 0, "no funds remaining to refund");

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        let donor_list: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::DonorList(campaign_id))
            .unwrap_or(Vec::new(&env));

        for donor in donor_list.iter() {
            let donor_deposit: i128 = env
                .storage()
                .persistent()
                .get(&DataKey::DonorDeposit(campaign_id, donor.clone()))
                .unwrap_or(0);

            if donor_deposit > 0 {
                // Proportional share: donor_deposit / total_deposited * remaining
                let refund = donor_deposit * remaining / campaign.total_deposited;
                if refund > 0 {
                    token_client.transfer(
                        &env.current_contract_address(),
                        &donor,
                        &refund,
                    );
                }
            }
        }

        campaign.clawback_executed = true;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // ── Read-only queries ───────────────────────────────────────────────────

    pub fn get_campaign(env: Env, campaign_id: u64) -> Campaign {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found")
    }

    pub fn get_milestone(env: Env, campaign_id: u64, milestone_index: u32) -> Milestone {
        env.storage()
            .persistent()
            .get(&DataKey::Milestone(campaign_id, milestone_index))
            .expect("milestone not found")
    }

    pub fn campaign_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_donor_deposit(env: Env, campaign_id: u64, donor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DonorDeposit(campaign_id, donor))
            .unwrap_or(0)
    }

    pub fn has_voted(env: Env, campaign_id: u64, donor: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::PauseVote(campaign_id, donor))
            .unwrap_or(false)
    }

    pub fn get_vote_weight(env: Env, campaign_id: u64) -> i128 {
        let campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");
        campaign.pause_vote_weight
    }
}

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, Env, String,
};

// ── Storage key enum ────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    CampaignCount,
    Campaign(u64),
    Milestone(u64, u32), // (campaign_id, milestone_index)
}

// ── Domain types ─────────────────────────────────────────────────────────────

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
    /// Institution / beneficiary that will receive the funds when released.
    pub recipient: Address,
    pub description: String,
}

#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub organizer: Address,
    pub total_deposited: i128,
    pub milestone_count: u32,
    /// Index of the next milestone that must be verified/released (sequential).
    pub current_milestone: u32,
    pub paused: bool,
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct DonationVaultContract;

#[contractimpl]
impl DonationVaultContract {

    // ── One-time setup ──────────────────────────────────────────────────────

    pub fn initialize(env: Env, admin: Address, token_address: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token_address);
        env.storage().instance().set(&DataKey::CampaignCount, &0u64);
    }

    // ── Campaign management ─────────────────────────────────────────────────

    /// Organizer creates a campaign and defines its milestones upfront.
    /// `milestone_amounts`  – ordered list of token amounts per milestone.
    /// `milestone_recipients` – institution address for each milestone release.
    /// `milestone_descs`      – human-readable description for each milestone.
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

        // Assign the next campaign ID.
        let campaign_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);

        let campaign = Campaign {
            organizer: organizer.clone(),
            total_deposited: 0,
            milestone_count: n,
            current_milestone: 0,
            paused: false,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);

        // Store each milestone.
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

    /// Any donor deposits tokens into a specific campaign's escrow.
    pub fn deposit(env: Env, campaign_id: u64, donor: Address, amount: i128) {
        donor.require_auth();
        assert!(amount > 0, "amount must be positive");

        let mut campaign: Campaign = env
            .storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");

        assert!(!campaign.paused, "campaign is paused");

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        campaign.total_deposited += amount;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // ── Milestone lifecycle ─────────────────────────────────────────────────

    /// Admin marks the current milestone as verified (documents checked).
    /// Milestones must be released in order — you cannot skip ahead.
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

    /// Admin releases funds for the current verified milestone to its recipient.
    /// Automatically advances `current_milestone` so the next one can begin.
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

        // Transfer funds to the institution.
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &milestone.recipient,
            &milestone.amount,
        );

        milestone.status = MilestoneStatus::Released;
        env.storage()
            .persistent()
            .set(&DataKey::Milestone(campaign_id, idx), &milestone);

        // Advance to next milestone.
        campaign.current_milestone += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Campaign(campaign_id), &campaign);
    }

    // ── Pause / unpause ─────────────────────────────────────────────────────

    /// Admin can pause a campaign (e.g., fraud suspected).
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
}

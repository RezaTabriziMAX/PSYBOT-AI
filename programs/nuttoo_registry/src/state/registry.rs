use anchor_lang::prelude::*;
use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct Policy {
    pub allow_forks: bool,
    pub allow_unverified: bool,
    pub max_artifact_bytes: u64,
    pub max_runs_per_module: u64,
}

#[account]
pub struct Registry {
    pub authority: Pubkey,
    pub created_at: i64,
    pub updated_at: i64,
    pub policy: Policy,
    pub module_count: u64,
    pub fork_count: u64,
    pub run_count: u64,
    pub bump: u8,
}

impl Registry {
    pub const LEN: usize =
        8 + // disc
        32 + // authority
        8 + 8 + // timestamps
        (1 + 1 + 8 + 8) + // policy
        8 + 8 + 8 + // counts
        1 + // bump
        DEFAULT_BUMP_PADDING;

    pub fn touch(&mut self, now: i64) {
        self.updated_at = now;
    }
}

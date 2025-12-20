use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct Run {
    pub registry: Pubkey,
    pub run_id: [u8; 32],
    pub module: Pubkey,
    pub fork: Pubkey,
    pub owner: Pubkey,
    pub created_at: i64,
    pub ok: bool,
    pub exit_code: i32,
    pub stdout_sha256: [u8; 32],
    pub stderr_sha256: [u8; 32],
    pub bump: u8,
}

impl Run {
    pub const LEN: usize =
        8 + 32 + 32 + 32 + 32 + 32 + 8 + 1 + 4 + 32 + 32 + 1 + DEFAULT_BUMP_PADDING;
}

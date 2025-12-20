use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct Fork {
    pub registry: Pubkey,
    pub fork_id: [u8; 32],
    pub module: Pubkey,
    pub owner: Pubkey,
    pub created_at: i64,
    pub notes: String,
    pub bump: u8,
}

impl Fork {
    pub fn space_for(notes_len: usize) -> usize {
        8 + 32 + 32 + 32 + 32 + 8 + (4 + notes_len) + 1 + DEFAULT_BUMP_PADDING
    }
}

use anchor_lang::prelude::*;
use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ModuleMeta {
    pub name: String,
    pub version: String,
    pub description: String,
    pub uri: String,
}

#[account]
pub struct Module {
    pub registry: Pubkey,
    pub module_id: [u8; 32],
    pub owner: Pubkey,
    pub created_at: i64,
    pub updated_at: i64,
    pub meta: ModuleMeta,
    pub manifest_sha256: [u8; 32],
    pub artifact_sha256: [u8; 32],
    pub artifact_size: u64,
    pub verified: bool,
    pub run_count: u64,
    pub bump: u8,
}

impl Module {
    pub fn space_for(meta: &ModuleMeta) -> usize {
        8 + // disc
        32 + // registry
        32 + // module_id
        32 + // owner
        8 + 8 + // timestamps
        4 + meta.name.len() +
        4 + meta.version.len() +
        4 + meta.description.len() +
        4 + meta.uri.len() +
        32 + // manifest hash
        32 + // artifact hash
        8 + // artifact size
        1 + // verified
        8 + // run_count
        1 + // bump
        DEFAULT_BUMP_PADDING
    }
}

use anchor_lang::prelude::*;

#[event]
pub struct RegistryInitialized {
    pub authority: Pubkey,
    pub registry: Pubkey,
}

#[event]
pub struct PolicyUpdated {
    pub authority: Pubkey,
    pub registry: Pubkey,
}

#[event]
pub struct ModulePublished {
    pub registry: Pubkey,
    pub module: Pubkey,
    pub module_id: [u8; 32],
    pub owner: Pubkey,
}

#[event]
pub struct ModuleUpdated {
    pub registry: Pubkey,
    pub module: Pubkey,
    pub module_id: [u8; 32],
}

#[event]
pub struct ForkCreated {
    pub registry: Pubkey,
    pub fork: Pubkey,
    pub fork_id: [u8; 32],
    pub module: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct ArtifactAttested {
    pub module: Pubkey,
    pub module_id: [u8; 32],
    pub artifact_sha256: [u8; 32],
    pub size: u64,
}

#[event]
pub struct RunRecorded {
    pub run: Pubkey,
    pub run_id: [u8; 32],
    pub module: Pubkey,
    pub ok: bool,
}

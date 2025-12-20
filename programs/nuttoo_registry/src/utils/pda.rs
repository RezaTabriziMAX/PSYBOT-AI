use anchor_lang::prelude::*;
use crate::constants::*;

pub fn registry_pda(program_id: &Pubkey, authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[REGISTRY_SEED, authority.as_ref()], program_id)
}

pub fn module_pda(program_id: &Pubkey, registry: &Pubkey, module_id: &[u8; 32]) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[MODULE_SEED, registry.as_ref(), module_id], program_id)
}

pub fn fork_pda(program_id: &Pubkey, registry: &Pubkey, fork_id: &[u8; 32]) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[FORK_SEED, registry.as_ref(), fork_id], program_id)
}

pub fn run_pda(program_id: &Pubkey, registry: &Pubkey, run_id: &[u8; 32]) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[RUN_SEED, registry.as_ref(), run_id], program_id)
}

use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::NuttooError;

pub fn require_nonempty(s: &str) -> Result<()> {
    if s.trim().is_empty() {
        return err!(NuttooError::InvalidInput);
    }
    Ok(())
}

pub fn require_max_len(s: &str, max: usize) -> Result<()> {
    if s.len() > max {
        return err!(NuttooError::InvalidInput);
    }
    Ok(())
}

pub fn validate_module_meta(name: &str, version: &str, description: &str, uri: &str) -> Result<()> {
    require_nonempty(name)?;
    require_nonempty(version)?;
    require_max_len(name, MAX_NAME_LEN)?;
    require_max_len(version, MAX_VERSION_LEN)?;
    require_max_len(description, MAX_DESC_LEN)?;
    require_max_len(uri, MAX_URI_LEN)?;
    Ok(())
}

pub fn validate_notes(notes: &str) -> Result<()> {
    require_nonempty(notes)?;
    require_max_len(notes, MAX_NOTES_LEN)?;
    Ok(())
}

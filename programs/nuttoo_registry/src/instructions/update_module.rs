use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::NuttooError;
use crate::events::*;
use crate::utils::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateModuleInput {
    pub name: String,
    pub version: String,
    pub description: String,
    pub uri: String,
    pub manifest_sha256: [u8; 32],
}

#[derive(Accounts)]
pub struct UpdateModule<'info> {
    #[account(mut, has_one = authority)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub module: Account<'info, Module>,
    pub authority: Signer<'info>,
}

pub fn handle(ctx: Context<UpdateModule>, input: UpdateModuleInput) -> Result<()> {
    let reg = &mut ctx.accounts.registry;
    require_keys_eq!(reg.authority, ctx.accounts.authority.key(), NuttooError::Unauthorized);

    validate_module_meta(&input.name, &input.version, &input.description, &input.uri)?;

    let m = &mut ctx.accounts.module;
    require_keys_eq!(m.registry, reg.key(), NuttooError::InvalidInput);

    m.meta.name = input.name;
    m.meta.version = input.version;
    m.meta.description = input.description;
    m.meta.uri = input.uri;
    m.manifest_sha256 = input.manifest_sha256;
    m.updated_at = Clock::get()?.unix_timestamp;

    emit!(ModuleUpdated {
        registry: reg.key(),
        module: m.key(),
        module_id: m.module_id,
    });

    Ok(())
}

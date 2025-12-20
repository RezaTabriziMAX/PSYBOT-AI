use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::NuttooError;
use crate::events::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AttestArtifactInput {
    pub artifact_sha256: [u8; 32],
    pub artifact_size: u64,
    pub verified: bool,
}

#[derive(Accounts)]
pub struct AttestArtifact<'info> {
    #[account(mut, has_one = authority)]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub module: Account<'info, Module>,
    pub authority: Signer<'info>,
}

pub fn handle(ctx: Context<AttestArtifact>, input: AttestArtifactInput) -> Result<()> {
    let reg = &mut ctx.accounts.registry;
    require_keys_eq!(reg.authority, ctx.accounts.authority.key(), NuttooError::Unauthorized);

    if input.artifact_size > reg.policy.max_artifact_bytes {
        return err!(NuttooError::ArtifactTooLarge);
    }

    if !reg.policy.allow_unverified && !input.verified {
        return err!(NuttooError::PolicyViolation);
    }

    let m = &mut ctx.accounts.module;
    require_keys_eq!(m.registry, reg.key(), NuttooError::InvalidInput);

    m.artifact_sha256 = input.artifact_sha256;
    m.artifact_size = input.artifact_size;
    m.verified = input.verified;
    m.updated_at = Clock::get()?.unix_timestamp;

    emit!(ArtifactAttested {
        module: m.key(),
        module_id: m.module_id,
        artifact_sha256: m.artifact_sha256,
        size: m.artifact_size,
    });

    Ok(())
}

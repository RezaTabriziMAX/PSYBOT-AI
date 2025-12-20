use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::NuttooError;
use crate::events::*;
use crate::utils::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PublishModuleInput {
    pub module_id: [u8; 32],
    pub name: String,
    pub version: String,
    pub description: String,
    pub uri: String,
    pub manifest_sha256: [u8; 32],
    pub artifact_sha256: [u8; 32],
    pub artifact_size: u64,
    pub verified: bool,
}

#[derive(Accounts)]
#[instruction(input: PublishModuleInput)]
pub struct PublishModule<'info> {
    #[account(mut, has_one = authority)]
    pub registry: Account<'info, Registry>,

    #[account(
        init,
        payer = payer,
        space = Module::space_for(&ModuleMeta {
            name: input.name.clone(),
            version: input.version.clone(),
            description: input.description.clone(),
            uri: input.uri.clone(),
        }),
        seeds = [MODULE_SEED, registry.key().as_ref(), &input.module_id],
        bump
    )]
    pub module: Account<'info, Module>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<PublishModule>, input: PublishModuleInput) -> Result<()> {
    let reg = &mut ctx.accounts.registry;

    require_keys_eq!(reg.authority, ctx.accounts.authority.key(), NuttooError::Unauthorized);

    validate_module_meta(&input.name, &input.version, &input.description, &input.uri)?;

    if input.artifact_size > reg.policy.max_artifact_bytes {
        return err!(NuttooError::ArtifactTooLarge);
    }

    if !reg.policy.allow_unverified && !input.verified {
        return err!(NuttooError::PolicyViolation);
    }

    let now = Clock::get()?.unix_timestamp;

    let meta = ModuleMeta {
        name: input.name,
        version: input.version,
        description: input.description,
        uri: input.uri,
    };

    let m = &mut ctx.accounts.module;
    m.registry = reg.key();
    m.module_id = input.module_id;
    m.owner = ctx.accounts.authority.key();
    m.created_at = now;
    m.updated_at = now;
    m.meta = meta;
    m.manifest_sha256 = input.manifest_sha256;
    m.artifact_sha256 = input.artifact_sha256;
    m.artifact_size = input.artifact_size;
    m.verified = input.verified;
    m.run_count = 0;
    m.bump = ctx.bumps.module;

    reg.module_count = reg.module_count.saturating_add(1);
    reg.touch(now);

    emit!(ModulePublished {
        registry: reg.key(),
        module: m.key(),
        module_id: m.module_id,
        owner: m.owner,
    });

    Ok(())
}

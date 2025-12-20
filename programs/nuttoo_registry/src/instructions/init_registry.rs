use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::events::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitRegistryInput {
    pub authority: Pubkey,
    pub policy: Policy,
}

#[derive(Accounts)]
#[instruction(input: InitRegistryInput)]
pub struct InitRegistry<'info> {
    #[account(
        init,
        payer = payer,
        space = Registry::LEN,
        seeds = [REGISTRY_SEED, input.authority.as_ref()],
        bump
    )]
    pub registry: Account<'info, Registry>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitRegistry>, input: InitRegistryInput) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;

    let reg = &mut ctx.accounts.registry;
    reg.authority = input.authority;
    reg.created_at = now;
    reg.updated_at = now;
    reg.policy = input.policy;
    reg.module_count = 0;
    reg.fork_count = 0;
    reg.run_count = 0;
    reg.bump = ctx.bumps.registry;

    emit!(RegistryInitialized {
        authority: reg.authority,
        registry: reg.key(),
    });

    Ok(())
}

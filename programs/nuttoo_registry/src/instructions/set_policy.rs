use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::NuttooError;
use crate::events::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SetPolicyInput {
    pub policy: Policy,
}

#[derive(Accounts)]
pub struct SetPolicy<'info> {
    #[account(mut, has_one = authority)]
    pub registry: Account<'info, Registry>,
    pub authority: Signer<'info>,
}

pub fn handle(ctx: Context<SetPolicy>, input: SetPolicyInput) -> Result<()> {
    let reg = &mut ctx.accounts.registry;
    require_keys_eq!(reg.authority, ctx.accounts.authority.key(), NuttooError::Unauthorized);

    reg.policy = input.policy;
    reg.touch(Clock::get()?.unix_timestamp);

    emit!(PolicyUpdated {
        authority: reg.authority,
        registry: reg.key(),
    });

    Ok(())
}

use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::NuttooError;
use crate::events::*;
use crate::utils::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateForkInput {
    pub fork_id: [u8; 32],
    pub notes: String,
}

#[derive(Accounts)]
#[instruction(input: CreateForkInput)]
pub struct CreateFork<'info> {
    #[account(mut)]
    pub registry: Account<'info, Registry>,

    pub module: Account<'info, Module>,

    #[account(
        init,
        payer = payer,
        space = Fork::space_for(input.notes.len()),
        seeds = [FORK_SEED, registry.key().as_ref(), &input.fork_id],
        bump
    )]
    pub fork: Account<'info, Fork>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<CreateFork>, input: CreateForkInput) -> Result<()> {
    let reg = &mut ctx.accounts.registry;

    if !reg.policy.allow_forks {
        return err!(NuttooError::PolicyViolation);
    }

    validate_notes(&input.notes)?;

    let now = Clock::get()?.unix_timestamp;

    let f = &mut ctx.accounts.fork;
    f.registry = reg.key();
    f.fork_id = input.fork_id;
    f.module = ctx.accounts.module.key();
    f.owner = ctx.accounts.authority.key();
    f.created_at = now;
    f.notes = input.notes;
    f.bump = ctx.bumps.fork;

    reg.fork_count = reg.fork_count.saturating_add(1);
    reg.touch(now);

    emit!(ForkCreated {
        registry: reg.key(),
        fork: f.key(),
        fork_id: f.fork_id,
        module: f.module,
        owner: f.owner,
    });

    Ok(())
}

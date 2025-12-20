use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::NuttooError;
use crate::events::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RecordRunInput {
    pub run_id: [u8; 32],
    pub fork: Pubkey,
    pub ok: bool,
    pub exit_code: i32,
    pub stdout_sha256: [u8; 32],
    pub stderr_sha256: [u8; 32],
}

#[derive(Accounts)]
#[instruction(input: RecordRunInput)]
pub struct RecordRun<'info> {
    #[account(mut, has_one = authority)]
    pub registry: Account<'info, Registry>,

    #[account(mut)]
    pub module: Account<'info, Module>,

    #[account(
        init,
        payer = payer,
        space = Run::LEN,
        seeds = [RUN_SEED, registry.key().as_ref(), &input.run_id],
        bump
    )]
    pub run: Account<'info, Run>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<RecordRun>, input: RecordRunInput) -> Result<()> {
    let reg = &mut ctx.accounts.registry;
    require_keys_eq!(reg.authority, ctx.accounts.authority.key(), NuttooError::Unauthorized);

    let m = &mut ctx.accounts.module;
    require_keys_eq!(m.registry, reg.key(), NuttooError::InvalidInput);

    if m.run_count >= reg.policy.max_runs_per_module {
        return err!(NuttooError::RunLimitReached);
    }

    let now = Clock::get()?.unix_timestamp;

    let r = &mut ctx.accounts.run;
    r.registry = reg.key();
    r.run_id = input.run_id;
    r.module = m.key();
    r.fork = input.fork;
    r.owner = ctx.accounts.authority.key();
    r.created_at = now;
    r.ok = input.ok;
    r.exit_code = input.exit_code;
    r.stdout_sha256 = input.stdout_sha256;
    r.stderr_sha256 = input.stderr_sha256;
    r.bump = ctx.bumps.run;

    m.run_count = m.run_count.saturating_add(1);
    m.updated_at = now;

    reg.run_count = reg.run_count.saturating_add(1);
    reg.touch(now);

    emit!(RunRecorded {
        run: r.key(),
        run_id: r.run_id,
        module: r.module,
        ok: r.ok,
    });

    Ok(())
}

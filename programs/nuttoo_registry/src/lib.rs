use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod state;
pub mod instructions;
pub mod utils;

use instructions::*;

declare_id!("NuTtOoReg1stry111111111111111111111111111111");

#[program]
pub mod nuttoo_registry {
    use super::*;

    pub fn init_registry(ctx: Context<InitRegistry>, input: InitRegistryInput) -> Result<()> {
        instructions::init_registry::handle(ctx, input)
    }

    pub fn set_policy(ctx: Context<SetPolicy>, input: SetPolicyInput) -> Result<()> {
        instructions::set_policy::handle(ctx, input)
    }

    pub fn publish_module(ctx: Context<PublishModule>, input: PublishModuleInput) -> Result<()> {
        instructions::publish_module::handle(ctx, input)
    }

    pub fn update_module(ctx: Context<UpdateModule>, input: UpdateModuleInput) -> Result<()> {
        instructions::update_module::handle(ctx, input)
    }

    pub fn create_fork(ctx: Context<CreateFork>, input: CreateForkInput) -> Result<()> {
        instructions::create_fork::handle(ctx, input)
    }

    pub fn attest_artifact(ctx: Context<AttestArtifact>, input: AttestArtifactInput) -> Result<()> {
        instructions::attest_artifact::handle(ctx, input)
    }

    pub fn record_run(ctx: Context<RecordRun>, input: RecordRunInput) -> Result<()> {
        instructions::record_run::handle(ctx, input)
    }
}

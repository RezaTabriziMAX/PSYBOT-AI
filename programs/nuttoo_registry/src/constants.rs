use anchor_lang::prelude::*;

pub const REGISTRY_SEED: &[u8] = b"registry";
pub const MODULE_SEED: &[u8] = b"module";
pub const FORK_SEED: &[u8] = b"fork";
pub const RUN_SEED: &[u8] = b"run";

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_VERSION_LEN: usize = 32;
pub const MAX_DESC_LEN: usize = 256;
pub const MAX_URI_LEN: usize = 256;
pub const MAX_NOTES_LEN: usize = 512;

pub const DEFAULT_BUMP_PADDING: usize = 8;

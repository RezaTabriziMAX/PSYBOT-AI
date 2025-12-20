use anchor_lang::prelude::*;

#[error_code]
pub enum NuttooError {
    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Registry is already initialized")]
    RegistryAlreadyInitialized,

    #[msg("Invalid input")]
    InvalidInput,

    #[msg("Policy violation")]
    PolicyViolation,

    #[msg("Manifest hash mismatch")]
    ManifestHashMismatch,

    #[msg("Artifact hash mismatch")]
    ArtifactHashMismatch,

    #[msg("Artifact too large")]
    ArtifactTooLarge,

    #[msg("Run limit reached")]
    RunLimitReached,
}

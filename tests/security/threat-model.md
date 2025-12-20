
# Threat Model (High Level)

## Assets
- Signing keys used for on-chain registrations
- Module artifacts (bundles)
- Attestation records
- Registry state integrity
- User tokens / API auth tokens

## Trust boundaries
- Public internet clients -> API
- API -> DB/queue/storage
- Worker/Agent -> sandbox runtime
- Indexer -> Solana RPC stream

## Primary threats
- Secret leakage (tokens, signing keys)
- Artifact tampering or supply-chain attacks
- Sandbox escapes (filesystem/network/process abuse)
- Denial-of-service via large inputs or expensive analysis
- RPC manipulation or reorg-related inconsistencies

## Mitigations
- Redaction in logs and strict secret handling
- Content-addressed artifacts and SHA256 checks
- Defense-in-depth sandboxing (container/firejail, no network by default)
- Rate limiting and request validation
- Idempotent indexer processing + checkpoints

## Residual risks
- Dependency vulnerabilities
- Misconfiguration of secrets or IAM
- Operational mistakes in deployments

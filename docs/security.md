# Nuttoo — Security

This document defines security principles, threat model assumptions, operational hardening, and recommended controls for Nuttoo deployments.

Nuttoo is a hybrid system:
- On-chain coordination on Solana (minimal, verifiable state)
- Off-chain services (API + workers + optional web)
- Infrastructure dependencies (Postgres, RPC providers, CI, artifact registry)

Security is treated as a continuous process. Nuttoo is designed to be forkable and auditable. "Trust" is earned through transparency, minimized privileges, and verifiable state.

---

## Security Objectives

Nuttoo aims to provide:

- **Integrity**: on-chain registry and lineage remain correct and tamper-resistant
- **Availability**: API and workers remain resilient under load and partial failures
- **Confidentiality**: secrets (keypairs, DB credentials, tokens) are protected
- **Non-repudiation**: on-chain actions are attributable and verifiable
- **Least privilege**: components only have the permissions they need
- **Auditability**: all critical actions are logged and traceable

---

## Threat Model

### Primary Assets

- Solana signing key(s) used for on-chain registrations or program interactions
- Database contents (module metadata, job state, analysis results)
- RPC credentials and provider endpoints
- CI credentials and artifact registry credentials
- Internal tokens and service-to-service credentials
- Release artifacts (images, packages, IDLs)

### Adversaries

- External attackers probing public endpoints
- Malicious users submitting hostile repositories and inputs
- Supply-chain attackers targeting dependencies or CI pipelines
- Insider threats or leaked credentials
- RPC provider issues (integrity/availability degradation)
- Misconfiguration leading to accidental exposure

### High-Risk Attack Surfaces

- Public API endpoints (auth, rate limits, input validation)
- Repository ingestion pipeline (untrusted code, large files, zip bombs)
- Worker execution environment (shelling out, filesystem access)
- Secrets handling (keypair material, DB creds)
- CI pipelines (token exposure, unpinned actions, artifact poisoning)
- On-chain transaction submission (replay, blockhash expiry, fee draining)

---

## Architectural Security Principles

### Minimal On-Chain State

On-chain programs should store:
- minimal registry references
- deterministic lineage pointers
- verifiable ownership/attribution metadata

Heavy computation and model logic remains off-chain.

### Forkability as Safety

Nuttoo is designed to be open and forkable:
- logic can be inspected
- changes can be audited
- alternative deployments can exist

Forking reduces the dependency on a single operator.

### Zero Trust for Inputs

All inputs to Nuttoo are untrusted:
- repository paths
- URLs
- webhooks
- file uploads
- environment variables provided by users

Validate, sanitize, and bound every input.

---

## Key Management

### Solana Keypair Handling

Treat Solana signing keys as the highest risk secret.

Recommended options (from simplest to strongest):

1) **Keypair file via secrets**  
   - Store the JSON keypair as a secret (Kubernetes Secret, Docker secret, secret manager)
   - Mount it read-only
   - Restrict filesystem permissions

2) **Keypair JSON in memory via environment variable**  
   - Inject keypair JSON as an env var
   - Decode in process memory
   - Never write to disk
   - Avoid logging env vars and crash dumps

3) **KMS-backed signing (advanced)**  
   - Use a remote signer or HSM/KMS integration
   - Workers and API never see raw private key material
   - Stronger operational security

### Key Rotation

- Maintain a rotation procedure and runbooks
- Prefer short-lived credentials for services and CI
- Rotate immediately on suspected compromise

### Logging Rules

Never log:
- private keys
- full keypair JSON
- seed phrases
- database passwords
- bearer tokens

Redact these values at logger boundaries.

---

## API Security

### Authentication

Recommended patterns:
- JWT or session tokens for authenticated endpoints
- Separate admin authentication from user authentication
- Service-to-service authentication for internal calls

Hard requirements:
- verify token signatures
- validate issuer, audience, expiry
- apply strict clock skew bounds

### Authorization

- Enforce role-based access control (RBAC) where applicable
- Restrict admin endpoints
- Use allow-lists for destructive actions
- Prevent horizontal privilege escalation (resource ownership checks)

### Rate Limiting and Abuse Protection

- IP-based and token-based rate limits
- Progressive backoff and temporary bans for repeated abuse
- Request size limits (headers and bodies)
- Concurrency limits per user

### Input Validation

- Enforce strict schemas for all request payloads
- Reject unknown fields (deny-by-default)
- Sanitize strings (length, encoding, reserved characters)
- Validate URLs (protocol allow-list, DNS rebinding mitigation)
- Validate repo paths (no path traversal, no symlinks escaping root)

---

## Repository Ingestion Security

Repository ingestion is a high-risk area because it handles untrusted content.

### Recommended Controls

- Enforce maximum repository size and file count
- Reject archives with suspicious compression ratios (zip bomb defense)
- Deny execution of repository-provided scripts by default
- Disable network access for analysis jobs unless explicitly required
- Use sandboxing (containers, seccomp, AppArmor) for worker jobs
- Use read-only mounts for repository sources where possible

### Path Traversal and Symlinks

- Normalize paths and reject `..` segments
- Do not follow symlinks during ingestion unless explicitly safe
- Ensure extracted files cannot escape the staging directory

---

## Worker Security

Workers commonly have:
- filesystem access
- network access
- RPC access
- database access
- sometimes signing keys

### Least Privilege

- Separate worker roles: ingestion-only vs on-chain registration
- Use separate service accounts and DB users if feasible
- Restrict outbound network egress (allow-list essential destinations)

### Sandboxing

Recommended:
- run workers in containers
- drop Linux capabilities
- read-only root filesystem when possible
- no hostPath mounts in Kubernetes except controlled volumes
- resource limits (CPU/memory) to prevent runaway jobs

### Dependency Isolation

- lock dependencies with a package lockfile
- avoid dynamically executing fetched code
- pin tool versions (Solana CLI, Node, pnpm)
- scan for known vulnerabilities

---

## Database Security

### Connectivity

- require TLS for managed Postgres
- restrict network access (private subnets, security groups)
- use separate DB users per service when possible

### Permissions

- API: read/write for runtime tables, no superuser privileges
- Worker: only what it needs (often read/write to job tables and metadata)
- Migrations: dedicated migration role with elevated rights

### Backups

- enable automated backups and PITR
- test restores periodically
- protect backups with encryption and access controls

---

## Solana and RPC Security

### RPC Provider

- use a paid provider for production
- maintain fallback providers
- monitor error rates and latency
- rotate RPC keys if provider uses keyed access

### Transaction Safety

- simulate transactions when possible
- enforce fee limits and retry bounds
- confirm commitment policy matches environment
- avoid unbounded loops that resubmit failed txs

### Program IDs and Cluster Safety

- do not reuse program IDs across environments unless intentional
- store per-environment config explicitly
- verify cluster selection (localnet/devnet/mainnet) on startup

---

## CI/CD and Supply Chain Security

### Dependency Controls

- pin versions in lockfiles
- enable automated vulnerability scanning
- review high-impact dependency upgrades
- avoid untrusted postinstall scripts if possible

### GitHub Actions / CI

Recommendations:
- pin GitHub Actions by commit SHA, not floating tags
- restrict token permissions (least privilege)
- avoid printing secrets in logs
- protect release branches and tags
- require code review for CI changes

### Artifact Integrity

- sign images (cosign or equivalent)
- produce SBOMs (software bill of materials)
- store build provenance metadata
- verify checksums for published artifacts

---

## Secrets Management

Preferred methods:
- Kubernetes Secrets (with encryption at rest)
- cloud secret managers
- Docker secrets for single-node

Operational rules:
- never store secrets in `.env` committed to Git
- restrict secret access to minimal pods/services
- implement secret rotation procedures
- audit secret access

---

## Observability and Auditing

### Structured Logging

- output JSON logs
- include correlation/request IDs
- redact secrets centrally
- keep logs immutable and access-controlled

### Metrics

Track:
- API error rates (4xx/5xx)
- auth failures
- rate limit events
- worker job failures and retries
- queue backlog depth
- RPC request failure rate
- transaction confirmation latency

### Tracing

- enable OpenTelemetry tracing where possible
- trace across API -> queue -> worker -> RPC interactions

### Audit Events

Log security-relevant events:
- authentication events
- permission/role changes
- key usage events (high-level only, no key material)
- deployment and migration events
- repository ingestion events (source, size, outcome)

---

## Incident Response

### Immediate Actions on Suspected Compromise

- revoke and rotate exposed secrets (DB, RPC, CI tokens)
- rotate signing keys if exposure is possible
- disable high-risk endpoints temporarily
- preserve logs and evidence
- notify stakeholders and publish postmortem if applicable

### Post-Incident Hardening

- add detection rules for the exploited path
- improve rate limiting and validation
- add additional sandboxing for workers
- tighten CI permissions and artifact signing

---

## Secure Defaults Checklist

Recommended defaults for production:

- TLS enforced for all external traffic
- strict request body size limits
- auth required for non-public endpoints
- per-route rate limits
- worker sandboxing enabled
- signing key stored in secrets, never in repo
- Postgres in private network, not public internet
- migrations run as a dedicated step before service rollout
- structured logs + metrics + alerts configured
- canary deploys for new versions
- pinned CI actions + artifact signing

---

## Known Risks and Mitigations

- **Untrusted repository ingestion**  
  Mitigation: size limits, sandboxing, no script execution, strict path handling

- **Keypair leakage**  
  Mitigation: secrets manager, no logs, minimal access scope, rotation plan

- **RPC throttling and provider faults**  
  Mitigation: paid provider, fallback endpoints, exponential backoff

- **Supply chain compromise**  
  Mitigation: pinned actions, lockfiles, SBOM, signature verification

- **Misconfiguration**  
  Mitigation: env validation, startup checks, infrastructure-as-code reviews

---

## Summary

Nuttoo security is built on:
- minimized on-chain surface area
- strict input validation
- hardened worker execution
- strong key and secret management
- auditable operations and observability
- secure CI and artifact integrity

Deploy Nuttoo like a system that never stops evolving, and never stops being observed.

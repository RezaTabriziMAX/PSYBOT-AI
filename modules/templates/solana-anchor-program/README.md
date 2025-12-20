[README.md](https://github.com/user-attachments/files/24270231/README.md)
# solana-anchor-program (Template)

Scaffold a Solana Anchor program with:
- Anchor + Rust program layout
- Deterministic PDA helpers
- Basic instruction skeleton
- TypeScript tests (anchor test)
- A minimal migration script

## What you get

- `Anchor.toml` configured for localnet/devnet/mainnet stanzas
- `Cargo.toml` for an Anchor program crate
- `programs/<program_name>/src` with a clean module split
- `tests/` with a TS spec that exercises init + a sample instruction

## How to use

Copy this template folder and rename:
- `programs/template_program` -> `programs/<your_program>`
- Update `declare_id!()` and `Anchor.toml` program id
- Implement your state + instructions

This template is designed to be packed by Nuttoo and published as a module artifact.

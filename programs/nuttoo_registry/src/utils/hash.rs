use anchor_lang::prelude::*;
use solana_program::hash::hashv;

pub fn sha256_32(data: &[u8]) -> [u8; 32] {
    // Solana hashv returns a 32-byte SHA256-based hash.
    let h = hashv(&[data]);
    h.to_bytes()
}

pub fn sha256_32_many(parts: &[&[u8]]) -> [u8; 32] {
    let h = hashv(parts);
    h.to_bytes()
}

pub fn id_from_text(s: &str) -> [u8; 32] {
    sha256_32(s.as_bytes())
}

import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function sha25632(buf: Buffer): number[] {
  const h = crypto.createHash("sha256").update(buf).digest();
  return Array.from(h.slice(0, 32));
}

describe("nuttoo_registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NuttooRegistry as anchor.Program;
  const authority = provider.wallet.publicKey;

  it("initializes registry and publishes module", async () => {
    const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registry"), authority.toBuffer()],
      program.programId
    );

    // Init registry (idempotent test: ignore if already exists).
    try {
      await program.methods
        .initRegistry({
          authority,
          policy: {
            allowForks: true,
            allowUnverified: true,
            maxArtifactBytes: new anchor.BN(10_000_000),
            maxRunsPerModule: new anchor.BN(10_000),
          },
        })
        .accounts({
          registry: registryPda,
          payer: authority,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (_) {}

    const moduleIdBytes = sha25632(Buffer.from("demo-module"));
    const [modulePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("module"), registryPda.toBuffer(), Buffer.from(moduleIdBytes)],
      program.programId
    );

    const manifestPath = path.join("tests", "fixtures", "module-manifest.json");
    const manifestBuf = Buffer.from(fs.readFileSync(manifestPath, "utf-8"), "utf-8");

    const artifactPath = path.join("tests", "fixtures", "sample-artifact.tgz");
    const artifactBuf = fs.readFileSync(artifactPath);

    await program.methods
      .publishModule({
        moduleId: Buffer.from(moduleIdBytes) as any,
        name: "demo-module",
        version: "0.1.0",
        description: "fixture publish",
        uri: "ipfs://example",
        manifestSha256: Buffer.from(sha25632(manifestBuf)) as any,
        artifactSha256: Buffer.from(sha25632(artifactBuf)) as any,
        artifactSize: new anchor.BN(artifactBuf.length),
        verified: true,
      })
      .accounts({
        registry: registryPda,
        module: modulePda,
        authority,
        payer: authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const moduleAccount: any = await program.account.module.fetch(modulePda);
    expect(moduleAccount.owner.toBase58()).to.eq(authority.toBase58());
    expect(moduleAccount.meta.name).to.eq("demo-module");
    expect(moduleAccount.verified).to.eq(true);
  });
});

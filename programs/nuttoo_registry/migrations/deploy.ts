import * as anchor from "@coral-xyz/anchor";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NuttooRegistry as anchor.Program;

  const authority = provider.wallet.publicKey;

  const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("registry"), authority.toBuffer()],
    program.programId
  );

  console.log("Program:", program.programId.toBase58());
  console.log("Authority:", authority.toBase58());
  console.log("Registry PDA:", registryPda.toBase58());

  try {
    await program.methods
      .initRegistry({
        authority,
        policy: {
          allowForks: true,
          allowUnverified: false,
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

    console.log("Registry initialized.");
  } catch (e: any) {
    console.error("Init failed:", e?.message ?? e);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

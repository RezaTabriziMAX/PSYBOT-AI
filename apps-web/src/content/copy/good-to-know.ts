export type GoodToKnow = {
  q: string;
  a: string;
};

export const GOOD_TO_KNOW: GoodToKnow[] = [
  {
    q: "Test token first, real token later",
    a: "The pump.fun token is for launch testing. The production token can be distributed 1:1 to test token holders based on a finalized snapshot rule.",
  },
  {
    q: "Forks are a feature, not drama",
    a: "Forks are recorded as lineage. They enable parallel evolution without erasing the history of where modules came from.",
  },
  {
    q: "Modularization is execution-first",
    a: "A module is only valuable if it can run. Nuttoo prioritizes minimal runnable units, predictable inputs/outputs, and hardened sandbox limits.",
  },
  {
    q: "Trust is verifiable",
    a: "Registries and lineage hashes allow anyone to verify what they are running and who signed the manifest they imported.",
  },
];

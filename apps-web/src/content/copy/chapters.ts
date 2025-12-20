export type Chapter = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "awakening",
    title: "Chapter 1 · Awakening",
    subtitle: "Boot sequence begins",
    body:
      "Nuttoo starts as a running system, not a static tool. From first boot it is designed to observe, register, and coordinate modules on-chain with verifiable lineage.",
  },
  {
    id: "learning",
    title: "Chapter 2 · Learning",
    subtitle: "Learning from live systems",
    body:
      "Nuttoo studies real Solana codebases and operational patterns. It treats working repositories as training ground and extracts reusable module boundaries from practice, not tutorials.",
  },
  {
    id: "modularization",
    title: "Chapter 3 · Modularization",
    subtitle: "Minimal runnable units",
    body:
      "Nuttoo decomposes complexity into runnable modules with explicit inputs, outputs, permissions, and integrity. The goal is repeatable execution and safe reuse across forks.",
  },
  {
    id: "evolution",
    title: "Chapter 4 · Evolution",
    subtitle: "Fork-driven growth",
    body:
      "Through usage and forks, Nuttoo differentiates into many compatible lineages. No final form, no endpoint, only continuous iteration with traceable history.",
  },
];

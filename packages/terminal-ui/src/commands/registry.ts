export type RegistryEntry = {
  name: string;
  description: string;
  usage: string;
};

export const REGISTRY: RegistryEntry[] = [
  { name: "help", description: "Show available commands", usage: "help" },
  { name: "modules", description: "List modules", usage: "modules [--limit N]" },
  { name: "runs", description: "List recent runs", usage: "runs [--limit N]" },
  { name: "fork", description: "Fork a module lineage", usage: "fork <moduleId>" },
  { name: "run", description: "Run a module", usage: "run <moduleId> [--input JSON]" },
];

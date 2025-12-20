export type Allowlist = {
  githubRepos: string[];
  npmPackages: string[];
  actions: Array<"publish-module" | "propose-fork" | "run-module">;
};

export function defaultAllowlist(): Allowlist {
  return {
    githubRepos: [],
    npmPackages: [],
    actions: ["publish-module", "propose-fork", "run-module"],
  };
}

export function isActionAllowed(allow: Allowlist, action: Allowlist["actions"][number]): boolean {
  return allow.actions.includes(action);
}

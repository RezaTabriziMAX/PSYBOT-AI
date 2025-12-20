import path from "node:path";

export type PathMap = {
  repoRoot: string;
  tmpDir: string;
  cacheDir: string;
  dataDir: string;
  logsDir: string;
};

export function resolvePaths(opts?: Partial<PathMap>): PathMap {
  const repoRoot = opts?.repoRoot ?? process.cwd();
  const tmpDir = opts?.tmpDir ?? path.join(repoRoot, ".nuttoo", "tmp");
  const cacheDir = opts?.cacheDir ?? path.join(repoRoot, ".nuttoo", "cache");
  const dataDir = opts?.dataDir ?? path.join(repoRoot, ".nuttoo", "data");
  const logsDir = opts?.logsDir ?? path.join(repoRoot, ".nuttoo", "logs");

  return { repoRoot, tmpDir, cacheDir, dataDir, logsDir };
}

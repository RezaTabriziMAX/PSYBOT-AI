/* eslint-disable no-console */
/**
 * Nuttoo CI release notes generator
 *
 * Purpose:
 * - Generate release notes from git history
 * - Support conventional commit-style grouping
 * - Output Markdown suitable for GitHub Releases
 *
 * Usage:
 *   node --loader ts-node/esm scripts/ci/release-notes.ts
 *
 * Examples:
 *   node --loader ts-node/esm scripts/ci/release-notes.ts --from v0.1.0 --to HEAD
 *   node --loader ts-node/esm scripts/ci/release-notes.ts --tag v0.2.0 --write RELEASE_NOTES.md
 *   node --loader ts-node/esm scripts/ci/release-notes.ts --json
 *
 * Options:
 *   --from <ref>        Start git ref (default: last tag)
 *   --to <ref>          End git ref (default: HEAD)
 *   --tag <name>        Release tag/version name
 *   --write <file>      Write markdown output to file
 *   --json              Output JSON instead of markdown
 *   --include-sha       Include short commit SHA
 *   --strict            Fail if git history cannot be resolved
 *
 * Output:
 * - Markdown or JSON
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type Args = {
  from?: string;
  to: string;
  tag?: string;
  write?: string;
  json: boolean;
  includeSha: boolean;
  strict: boolean;
};

type Commit = {
  sha: string;
  subject: string;
  body: string;
};

type Section = {
  title: string;
  commits: Commit[];
};

function die(msg: string): never {
  console.error(`[release-notes] error: ${msg}`);
  process.exit(1);
}

function runGit(args: string[]): string {
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(r.stderr || "git command failed");
  }
  return r.stdout.trim();
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    to: "HEAD",
    json: false,
    includeSha: false,
    strict: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--from") {
      args.from = argv[++i];
      if (!args.from) die("Missing value for --from");
      continue;
    }
    if (a === "--to") {
      args.to = argv[++i] ?? "HEAD";
      continue;
    }
    if (a === "--tag") {
      args.tag = argv[++i];
      if (!args.tag) die("Missing value for --tag");
      continue;
    }
    if (a === "--write") {
      args.write = argv[++i];
      if (!args.write) die("Missing value for --write");
      continue;
    }
    if (a === "--json") {
      args.json = true;
      continue;
    }
    if (a === "--include-sha") {
      args.includeSha = true;
      continue;
    }
    if (a === "--strict") {
      args.strict = true;
      continue;
    }
    if (a === "-h" || a === "--help") {
      console.log(`
Usage:
  node --loader ts-node/esm scripts/ci/release-notes.ts [options]

Options:
  --from <ref>        Start git ref (default: last tag)
  --to <ref>          End git ref (default: HEAD)
  --tag <name>        Release tag/version label
  --write <file>      Write markdown to file
  --json              Output JSON
  --include-sha       Include short commit SHA
  --strict            Fail if git is unavailable
      `.trim());
      process.exit(0);
    }
    die(`Unknown argument: ${a}`);
  }

  return args;
}

function lastTag(): string | undefined {
  try {
    const out = runGit(["describe", "--tags", "--abbrev=0"]);
    return out || undefined;
  } catch {
    return undefined;
  }
}

function collectCommits(from: string | undefined, to: string): Commit[] {
  const range = from ? `${from}..${to}` : to;
  const format = "%H%n%s%n%b%n---END---";
  const raw = runGit(["log", range, `--pretty=format:${format}`]);
  if (!raw) return [];

  const blocks = raw.split("---END---").map((b) => b.trim()).filter(Boolean);
  return blocks.map((b) => {
    const lines = b.split("\n");
    const sha = lines.shift() ?? "";
    const subject = lines.shift() ?? "";
    const body = lines.join("\n").trim();
    return { sha, subject, body };
  });
}

function classify(commits: Commit[]): Section[] {
  const sections: Record<string, Commit[]> = {
    "Breaking Changes": [],
    "Features": [],
    "Fixes": [],
    "Performance": [],
    "Refactors": [],
    "Chores": [],
    "Other": []
  };

  for (const c of commits) {
    const s = c.subject.toLowerCase();
    if (s.includes("breaking") || s.includes("!:")) {
      sections["Breaking Changes"].push(c);
    } else if (s.startsWith("feat")) {
      sections["Features"].push(c);
    } else if (s.startsWith("fix")) {
      sections["Fixes"].push(c);
    } else if (s.startsWith("perf")) {
      sections["Performance"].push(c);
    } else if (s.startsWith("refactor")) {
      sections["Refactors"].push(c);
    } else if (s.startsWith("chore") || s.startsWith("ci") || s.startsWith("build")) {
      sections["Chores"].push(c);
    } else {
      sections["Other"].push(c);
    }
  }

  return Object.entries(sections)
    .filter(([, cs]) => cs.length > 0)
    .map(([title, cs]) => ({ title, commits: cs }));
}

function toMarkdown(
  sections: Section[],
  opts: { includeSha: boolean; tag?: string; from?: string; to: string }
): string {
  const lines: string[] = [];

  const title = opts.tag ? `## ${opts.tag}` : "## Release Notes";
  lines.push(title);
  lines.push("");

  if (opts.from) {
    lines.push(`Changes from \`${opts.from}\` to \`${opts.to}\``);
    lines.push("");
  }

  for (const s of sections) {
    lines.push(`### ${s.title}`);
    lines.push("");
    for (const c of s.commits) {
      const sha = opts.includeSha ? ` (${c.sha.slice(0, 7)})` : "";
      lines.push(`- ${c.subject}${sha}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  let from = args.from;
  if (!from) {
    from = lastTag();
    if (!from) {
      if (args.strict) die("No git tags found and --from not provided");
    }
  }

  let commits: Commit[] = [];
  try {
    commits = collectCommits(from, args.to);
  } catch (e) {
    if (args.strict) {
      die(e instanceof Error ? e.message : String(e));
    }
  }

  const sections = classify(commits);

  if (args.json) {
    const out = {
      tag: args.tag,
      from,
      to: args.to,
      sections
    };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const md = toMarkdown(sections, {
    includeSha: args.includeSha,
    tag: args.tag,
    from,
    to: args.to
  });

  if (args.write) {
    const file = path.resolve(process.cwd(), args.write);
    fs.writeFileSync(file, md, "utf8");
    console.log(`[release-notes] wrote ${file}`);
  } else {
    console.log(md);
  }
}

main();

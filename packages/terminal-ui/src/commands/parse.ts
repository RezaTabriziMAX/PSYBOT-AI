export type ParsedCommand = {
  name: string;
  args: string[];
};

export function parseCommand(line: string): ParsedCommand {
  const tokens = tokenize(line.trim());
  const name = tokens.shift() ?? "";
  return { name, args: tokens };
}

function tokenize(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export function box(lines: string[], width?: number): string[] {
  const w = width ?? Math.max(...lines.map(l => l.length), 0);
  const top = "+" + "-".repeat(w + 2) + "+";
  const out = [top];
  for (const l of lines) {
    const pad = " ".repeat(Math.max(0, w - l.length));
    out.push("| " + l + pad + " |");
  }
  out.push(top);
  return out;
}

export function padRight(s: string, w: number): string {
  if (s.length >= w) return s;
  return s + " ".repeat(w - s.length);
}

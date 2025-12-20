export function parseCorsOrigins(value: string): string[] | true {
  const v = (value ?? "*").trim();
  if (v === "*" || v.length === 0) return true;
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

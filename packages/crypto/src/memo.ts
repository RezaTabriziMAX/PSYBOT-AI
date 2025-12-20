export type MemoEnvelope = {
  v: 1;
  type: string;
  ts: number;
  payload: unknown;
};

export function createMemo(type: string, payload: unknown): MemoEnvelope {
  return { v: 1, type, ts: Date.now(), payload };
}

export function encodeMemo(memo: MemoEnvelope): string {
  return JSON.stringify(memo);
}

export function decodeMemo(raw: string): MemoEnvelope {
  const obj = JSON.parse(raw);
  if (!obj || obj.v !== 1 || typeof obj.type !== "string" || typeof obj.ts !== "number") {
    throw new Error("Invalid memo envelope");
  }
  return obj as MemoEnvelope;
}

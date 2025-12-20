export type ParseInput = {
  programId: string;
  signature: string;
  slot: number;
  logs: string[];
};

export type ParsedEvent = {
  type: "program_log";
  programId: string;
  signature: string;
  slot: number;
  line: string;
};

export function parse(input: ParseInput): ParsedEvent[] {
  const out: ParsedEvent[] = [];
  for (const line of input.logs) {
    out.push({
      type: "program_log",
      programId: input.programId,
      signature: input.signature,
      slot: input.slot,
      line,
    });
  }
  return out;
}

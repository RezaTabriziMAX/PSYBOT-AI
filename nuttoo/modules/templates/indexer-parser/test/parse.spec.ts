import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../src/index.js";

test("parse returns normalized events", () => {
  const out = parse({
    programId: "Prog1111111111111111111111111111111111111",
    signature: "Sig1111111111111111111111111111111111111111111111111111111",
    slot: 123,
    logs: ["Program log: hello"],
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].type, "program_log");
});

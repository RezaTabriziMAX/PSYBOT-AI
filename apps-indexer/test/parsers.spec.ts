import { describe, it, expect } from "vitest";
import { parseRegistryEventsFromLogs } from "../src/parsers/registry.events.js";
import { parseForkEventsFromLogs } from "../src/parsers/fork.events.js";
import { parseRunEventsFromLogs } from "../src/parsers/run.events.js";

describe("parsers", () => {
  it("parses registry events", () => {
    const logs = ["Program log: NUTTOO:MODULE_REGISTERED moduleId=abc name=foo version=1.0.0 sha=deadbeef"];
    const ev = parseRegistryEventsFromLogs(logs);
    expect(ev.length).toBe(1);
    expect(ev[0].type).toBe("ModuleRegistered");
  });

  it("parses fork events", () => {
    const logs = ["Program log: NUTTOO:FORK_CREATED forkId=f1 moduleId=m1 parentForkId=f0"];
    const ev = parseForkEventsFromLogs(logs);
    expect(ev.length).toBe(1);
    expect(ev[0].type).toBe("ForkCreated");
  });

  it("parses run events", () => {
    const logs = ["Program log: NUTTOO:RUN_STATUS runId=r1 status=SUCCEEDED"];
    const ev = parseRunEventsFromLogs(logs);
    expect(ev.length).toBe(1);
    expect(ev[0].type).toBe("RunStatus");
  });
});

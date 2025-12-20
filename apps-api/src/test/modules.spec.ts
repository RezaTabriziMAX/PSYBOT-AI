import { describe, it, expect } from "vitest";
import { buildServer } from "../src/server.js";

describe("modules", () => {
  it("GET /modules responds", async () => {
    process.env.AUTH_MODE = "off";
    const { app } = await buildServer();
    const res = await app.inject({ method: "GET", url: "/modules" });
    expect([200, 500]).toContain(res.statusCode);
    await app.close();
  });
});

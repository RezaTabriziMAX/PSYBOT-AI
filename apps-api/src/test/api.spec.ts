import { describe, it, expect } from "vitest";
import { buildServer } from "../src/server.js";

describe("api", () => {
  it("healthz returns ok", async () => {
    process.env.AUTH_MODE = "off";
    const { app } = await buildServer();
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.ok).toBe(true);
    await app.close();
  });
});

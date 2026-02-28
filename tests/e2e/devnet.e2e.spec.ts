import test from "node:test";
import assert from "node:assert/strict";

const API = process.env.NUTTOO_API_BASE_URL ?? "https://api.nuttoo.example";

test("devnet: health endpoint is reachable", async () => {
  const res = await fetch(`${API}/healthz`);
  assert.ok([200, 401, 403].includes(res.status));
});    

import test from "node:test";
import assert from "node:assert/strict";

const API = process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080";

async function getText(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  return { res, text };
}

test("localnet: /healthz returns 200", async () => {
  const { res } = await getText(`${API}/healthz`);
  assert.equal(res.status, 200);
});

test("localnet: /readyz returns 200", async () => {
  const { res } = await getText(`${API}/readyz`);
  assert.equal(res.status, 200);
});

test("localnet: unknown route returns 404", async () => {
  const res = await fetch(`${API}/__nuttoo_unknown__`);
  assert.equal(res.status, 404);
});

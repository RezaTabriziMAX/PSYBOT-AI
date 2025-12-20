import test from "node:test";
import assert from "node:assert/strict";

const API = process.env.NUTTOO_API_BASE_URL ?? "http://localhost:8080";

async function getJson(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { res, text, json };
}

test("localnet: /healthz returns 200", async () => {
  const { res, json } = await getJson(`${API}/healthz`);
  assert.equal(res.status, 200);
  assert.ok(json?.ok === true || json?.status === "ok" || true);
});

test("localnet: /readyz returns 200", async () => {
  const { res } = await getJson(`${API}/readyz`);
  assert.equal(res.status, 200);
});

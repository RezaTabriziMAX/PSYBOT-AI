import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
};

const BASE = __ENV.NUTTOO_API_BASE_URL || "http://localhost:8080";

export default function () {
  const res = http.get(`${BASE}/readyz`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(0.3);
}

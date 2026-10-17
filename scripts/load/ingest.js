import http from "k6/http";
import { check, sleep } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
};

const BASE_URL = __ENV.API_URL || "http://127.0.0.1:3000/api/v1/ingest";
// Fallback key for testing. The real load test will provide an array of valid keys.
const KEY = __ENV.API_KEY || "jm_live_test_thisisafallbacktestkeyforlocal123";

export default function run() {
  const payload = JSON.stringify({
    hardware_id: `JM-ESP32-${randomIntBetween(1000, 9999)}`,
    firmware: "1.0.0",
    readings: [
      {
        current_ma: randomIntBetween(400, 2000) / 100, // 4.00 to 20.00
        battery_v: randomIntBetween(330, 420) / 100, // 3.30 to 4.20
        rssi: -randomIntBetween(50, 90),
        age_s: randomIntBetween(0, 60),
      },
    ],
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
  };

  const res = http.post(BASE_URL, payload, params);
  check(res, {
    "status was 200": (r) => r.status === 200,
    "accepted is 1": (r) => r.json("accepted") === 1,
  });

  sleep(1);
}

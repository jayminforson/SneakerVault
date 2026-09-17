#!/usr/bin/env node
/**
 * Provisions an MTN MoMo SANDBOX API user + key and writes them to .env.local.
 *
 * Prerequisites: MOMO_SUBSCRIPTION_KEY set in .env.local (Collections product).
 * Usage: npm run momo:setup
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import crypto from "crypto";

const envPath = path.join(process.cwd(), ".env.local");

function loadEnv() {
  try {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    console.error("✗ Could not read .env.local — run this from the project root.");
    process.exit(1);
  }
}

function updateEnv(key, value) {
  let content = readFileSync(envPath, "utf-8");
  const re = new RegExp(`^(${key}=).*$`, "m");
  content = re.test(content)
    ? content.replace(re, `$1${value}`)
    : content + `\n${key}=${value}\n`;
  writeFileSync(envPath, content);
}

const BASE = "https://sandbox.momodeveloper.mtn.com";
const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY;

loadEnv();

if (!SUBSCRIPTION_KEY) {
  console.error(
    "✗ MOMO_SUBSCRIPTION_KEY is missing.\n" +
      "  1. Sign up at https://momodeveloper.mtn.com\n" +
      "  2. Subscribe to the Collections product\n" +
      "  3. Paste the subscription key into .env.local\n" +
      "  4. Re-run: npm run momo:setup"
  );
  process.exit(1);
}

const apiUser = process.env.MOMO_API_USER || crypto.randomUUID();
const headers = {
  "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
  "Content-Type": "application/json",
};

// 1. Provision the API user (idempotent if it already exists)
console.log("→ Creating sandbox API user…");
const createRes = await fetch(`${BASE}/v1_0/apiuser`, {
  method: "POST",
  headers: { ...headers, "X-Reference-Id": apiUser },
  body: JSON.stringify({ providerCallbackHost: "localhost" }),
});
if (!createRes.ok && createRes.status !== 401) {
  // 401 = user already exists, safe to continue
  console.error(`✗ Failed to create API user (${createRes.status}):`, await createRes.text());
  process.exit(1);
}

// 2. Generate the API key
console.log("→ Generating API key…");
const keyRes = await fetch(`${BASE}/v1_0/apiuser/${apiUser}/apikey`, {
  method: "POST",
  headers,
});
if (!keyRes.ok) {
  console.error(`✗ Failed to generate API key (${keyRes.status}):`, await keyRes.text());
  process.exit(1);
}
const { apiKey } = await keyRes.json();

// 3. Persist to .env.local
updateEnv("MOMO_API_USER", apiUser);
updateEnv("MOMO_API_KEY", apiKey);

console.log("\n✓ Sandbox credentials written to .env.local");
console.log(`  MOMO_API_USER=${apiUser}`);
console.log("  MOMO_API_KEY=***");
console.log("\nRestart `npm run dev` and test a checkout — sandbox mode will simulate payments.");

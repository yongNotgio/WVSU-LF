#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const cleanupArg = process.argv.includes("--no-cleanup")
  ? '{"cleanup":false}'
  : '{"cleanup":true}';

const result = spawnSync(
  "npx",
  ["convex", "run", "internal.e2e.runVerificationMatrix", cleanupArg],
  {
  stdio: "inherit",
  shell: true,
  }
);

if (result.error) {
  console.error("Failed to execute Convex matrix runner:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

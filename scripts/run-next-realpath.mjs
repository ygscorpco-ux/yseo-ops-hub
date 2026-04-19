import fs from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const nextArgs = process.argv.slice(2);

if (nextArgs.length === 0) {
  console.error("Usage: node scripts/run-next-realpath.mjs <next-args...>");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const workspaceCwd = process.cwd();
const realCwd = fs.realpathSync.native(workspaceCwd);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  cwd: realCwd,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

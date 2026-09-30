// Static SPA build for Vercel: `npm run build:vercel` -> dist-spa/ (with index.html).
// Runs `vite build` with BUILD_TARGET=spa (see vite.config.ts), then copies the
// client output to dist-spa so it can't be confused with the Cloudflare SSR build.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, BUILD_TARGET: "spa" },
});
if (result.status !== 0) process.exit(result.status ?? 1);

if (!existsSync("dist/client/index.html")) {
  console.error("SPA build finished but dist/client/index.html is missing");
  process.exit(1);
}
rmSync("dist-spa", { recursive: true, force: true });
cpSync("dist/client", "dist-spa", { recursive: true });
console.log("Static SPA ready in dist-spa/");

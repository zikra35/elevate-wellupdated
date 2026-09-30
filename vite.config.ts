// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// `npm run build:vercel` sets BUILD_TARGET=spa: a static single-page build with an
// index.html (no Cloudflare worker, no SSR server) that Vercel can serve directly.
const isSpaBuild = process.env.BUILD_TARGET === "spa";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig(
  isSpaBuild
    ? {
        cloudflare: false,
        // The prerender step starts a local preview server; bind it to IPv4 so it
        // also works on build machines without IPv6.
        vite: { preview: { host: "127.0.0.1" } },
        tanstackStart: {
          server: { entry: "server" },
          spa: {
            enabled: true,
            prerender: { outputPath: "/index.html", crawlLinks: false, retryCount: 0 },
          },
        },
      }
    : {
        tanstackStart: {
          server: { entry: "server" },
        },
      },
);

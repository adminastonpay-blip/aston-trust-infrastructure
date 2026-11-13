import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" }
    })
  ],
  test: {
    include: ["tests/**/*.integration.test.mjs"],
    testTimeout: 30_000,
    hookTimeout: 30_000
  }
});

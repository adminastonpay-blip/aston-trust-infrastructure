import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";

export default defineConfig({
  plugins: [cloudflareTest({
    configPath: "./wrangler.jsonc",
    persistState: false
  })],
  test: {
    include: ["tests/**/*.integration.test.mjs"],
    poolOptions: {
      workers: {
        singleWorker: true
      }
    }
  }
});

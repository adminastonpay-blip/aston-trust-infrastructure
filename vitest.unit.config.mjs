import {defineConfig} from "vitest/config";
export default defineConfig({test:{include:["tests/unit/**/*.unit.test.{mjs,ts}"],environment:"node",testTimeout:15000}});

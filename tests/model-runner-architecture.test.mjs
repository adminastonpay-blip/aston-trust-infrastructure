import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("env.AI.run is reachable only from the guarded Model Runner", async () => {
  for (const path of ["src/worker/index.mjs", "src/worker/agent-identity.mjs", "src/core/safety-interlock.mjs", "src/staging/harness.mjs"]) {
    const source = await readFile(new URL("../" + path, import.meta.url), "utf8");
    assert.equal(source.includes("env.AI.run("), false, path + " must not call Workers AI directly");
  }
  const runner = await readFile(new URL("../src/core/model-runner.mjs", import.meta.url), "utf8");
  assert.equal((runner.match(/env\.AI\.run\(/g) || []).length, 1);
  assert.match(runner, /authorization\.decision !== "ALLOW"/);
  assert.match(runner, /authorization\.action !== "ai\.inference"/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

async function collect(directory) {
  const entries = await readdir(new URL("../" + directory, import.meta.url), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.name.endsWith(".mjs")) files.push(path);
  }
  return files;
}

test("env.AI.run is reachable only from the guarded Model Runner", async () => {
  const files = await collect("src");
  for (const path of files.filter((value) => value !== "src/core/model-runner.mjs")) {
    const source = await readFile(new URL("../" + path, import.meta.url), "utf8");
    assert.equal(source.includes("env.AI.run("), false, path + " must not call Workers AI directly");
  }
  const runner = await readFile(new URL("../src/core/model-runner.mjs", import.meta.url), "utf8");
  assert.equal((runner.match(/env\.AI\.run\(/g) || []).length, 1);
  assert.match(runner, /authorization\.decision !== "ALLOW"/);
  assert.match(runner, /authorization\.action !== "ai\.inference"/);
});

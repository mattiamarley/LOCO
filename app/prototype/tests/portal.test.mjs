import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

test('prototype HTML entrypoints and modules are portable with available local assets', () => {
  const htmlFiles = ['index.html', 'laboratory.html', 'workspace.html'];
  const moduleFiles = ['app.mjs', 'workspace.mjs', 'castle.mjs', 'room3d.mjs', 'model.mjs'];

  for (const file of [...htmlFiles, ...moduleFiles]) {
    const content = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.ok(!/https?:\/\//.test(content), `${file}: unexpected remote runtime dependency`);
    for (const match of content.matchAll(/(?:src=")([^"$]+)"/g)) {
      const ref = match[1].split('?')[0];
      assert.ok(statSync(new URL('../' + ref, import.meta.url)).size > 0, `${file}: empty or missing asset ${ref}`);
    }
  }
});

test('static prototype entrypoints enforce strict offline CSP', () => {
  for (const file of ['index.html', 'laboratory.html']) {
    const html = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.ok(html.includes("connect-src 'none'"), `${file}: missing offline connect-src CSP`);
  }
});

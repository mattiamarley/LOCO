import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {views} from '../figma-views.mjs';

test('all exported screens are portable HTML with available local assets',()=>{
  assert.equal(Object.keys(views).length,15);
  for(const [name,markup] of Object.entries(views)){
    assert.ok(!/<[A-Z]|className=|src=\{|style=\{/.test(markup),`${name}: unresolved JSX`);
    assert.ok(!/https?:\/\//.test(markup),`${name}: remote runtime dependency`);
    for(const match of markup.matchAll(/(?:src="|mask-image:url\()([^"\)]+)/g)){
      assert.ok(statSync(new URL('../'+match[1],import.meta.url)).size>0,`${name}: empty asset`);
    }
  }
});

test('published profile uses example contact and payment data',()=>{
  assert.ok(views.profile.includes('demo@example.com'));
  assert.ok(!/\b(?:\d[ -]?){13,19}\b|cirivane@|Via Morozzo/.test(views.profile));
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(index.includes("connect-src 'none'"));
});

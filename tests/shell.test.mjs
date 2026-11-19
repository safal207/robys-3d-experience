import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('buttons bound in code exist in HTML',()=>{
  const ids=Array.from(main.matchAll(/getElementById\('([^']+)'\)/g),match=>match[1]);
  for(const id of ids)assert.match(html,new RegExp(`id="${id}"`),`Missing UI element ${id}`);
});
test('HTML uses actual module import map and pinned Three.js version',()=>{
  assert.match(html,/type="importmap"/);
  assert.match(html,/three@0\.180\.0\/build\/three\.module\.js/);
  assert.match(html,/three@0\.180\.0\/examples\/jsm\//);
});
test('all CSS and JS site assets exist',()=>{
  for(const asset of ['src/style.css','src/main.js','src/scene.js','src/navigation.js','public/favicon.svg']){
    assert.ok(existsSync(new URL(`../${asset}`,import.meta.url)),asset);
  }
});
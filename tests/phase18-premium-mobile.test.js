import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/index.html', root), 'utf8');
const premium = await readFile(new URL('public/premium-v18.js', root), 'utf8');
const styles = await readFile(new URL('public/premium-v18.css', root), 'utf8');
const design = await readFile(new URL('public/design.js', root), 'utf8');
const sw = await readFile(new URL('public/service-worker.js', root), 'utf8');

test('divide a experiência em analisar, resultado e estado', () => {
  for (const id of ['premium-screen-analyze', 'premium-screen-result', 'premium-screen-status']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /data-premium-route="analyze"/);
  assert.match(html, /data-premium-route="result"/);
  assert.match(html, /data-premium-route="status"/);
});

test('usa navegação inferior com indicação de página atual', () => {
  assert.match(html, /premium-tab-bar/);
  assert.match(premium, /aria-current/);
  assert.match(premium, /activateScreen/);
  assert.match(styles, /position:\s*fixed/);
  assert.match(styles, /safe-area-inset-bottom/);
});

test('leva a análise para a tela de resultado e mantém nova análise', () => {
  assert.match(premium, /analyzeButton\?\.addEventListener\('click', openResult\)/);
  assert.match(premium, /barAnalyze\?\.addEventListener\('click', openResult\)/);
  assert.match(premium, /newAnalysis\?\.addEventListener/);
});

test('move o painel operacional para a tela de estado', () => {
  assert.match(html, /id="premium-status-mount"/);
  assert.match(premium, /operational-status/);
  assert.match(premium, /statusMount\.append/);
});

test('preserva assets premium no runtime e no PWA da Fase 20', () => {
  assert.match(design, /premium-v18\.js/);
  assert.match(html, /premium-v18\.css/);
  assert.match(sw, /premium-v18\.css/);
  assert.match(sw, /premium-v18\.js/);
  assert.match(sw, /screen-assistant-v20-saas-auth/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const css = read('public/result-v22.css');
const js = read('public/result-v22.js');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('resultado mobile remove elementos redundantes e barras sobrepostas', () => {
  assert.match(css, /data-premium-screen="result"[\s\S]*#layout-toggle/);
  assert.match(css, /design-v21-journey/);
  assert.match(css, /design-v21-result-lead/);
  assert.match(css, /premium-tab-bar/);
  assert.match(css, /display: none !important/);
});

test('resultado usa uma coluna plana sem cartões aninhados', () => {
  assert.match(css, /\.response-panel[\s\S]*border: 0/);
  assert.match(css, /\.answer[\s\S]*background: transparent/);
  assert.match(css, /\.response-section details[\s\S]*border-bottom/);
  assert.match(css, /\.summary-card[\s\S]*background: transparent/);
});

test('ações principais ficam compactas e não cobrem o conteúdo', () => {
  assert.match(css, /\.quick-actions[\s\S]*repeat\(3/);
  assert.match(css, /#stop-voice:disabled[\s\S]*display: none/);
  assert.match(css, /padding-bottom: max\(24px/);
});

test('metadados técnicos ficam recolhidos e preservados', () => {
  assert.match(js, /technical-details-v22/);
  assert.match(js, /Detalhes técnicos/);
  assert.match(js, /append\(summary, meta\)/);
});

test('sincronização não força rolagem durante o processamento', () => {
  assert.doesNotMatch(js, /scrollIntoView/);
  assert.match(js, /requestAnimationFrame/);
  assert.match(js, /setHidden/);
});

test('carregador e PWA publicam os assets da versão 22', () => {
  assert.match(loader, /result-v22\.css/);
  assert.match(loader, /result-v22\.js/);
  assert.match(serviceWorker, /screen-assistant-v22-mobile-result-simplification/);
  assert.match(serviceWorker, /result-v22\.css/);
  assert.match(serviceWorker, /result-v22\.js/);
});

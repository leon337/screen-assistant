import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/index.html', root), 'utf8');
const app = await readFile(new URL('public/app.js', root), 'utf8');
const styles = await readFile(new URL('public/styles.css', root), 'utf8');
const sw = await readFile(new URL('public/service-worker.js', root), 'utf8');
const manifest = JSON.parse(await readFile(new URL('public/manifest.webmanifest', root), 'utf8'));
const api = await readFile(new URL('api/v1/analyze-screen.js', root), 'utf8');
const profiles = await readFile(new URL('src/server/expert-profiles.js', root), 'utf8');
const config = await readFile(new URL('src/server/config.js', root), 'utf8');

test('oferece modo compacto e modo desktop', () => {
  assert.match(html, /id="layout-toggle"/);
  assert.match(app, /screen-assistant-layout/);
  assert.match(app, /pointer: coarse/);
  assert.match(styles, /body\[data-layout="compact"\]/);
});

test('recolhe compartilhamento de tela sem removê-lo', () => {
  assert.match(html, /<details[^>]*id="screen-panel"/);
  assert.match(html, /id="share-screen"/);
  assert.match(html, /Compartilhar tela/);
  assert.match(app, /getDisplayMedia/);
});

test('possui barra de ações móvel', () => {
  assert.match(html, /id="mobile-action-bar"/);
  assert.match(html, /id="bar-camera"/);
  assert.match(html, /id="bar-gallery"/);
  assert.match(html, /id="bar-analyze"/);
});

test('inclui ações pós-análise', () => {
  for (const id of ['new-analysis', 'change-image', 'repeat-analysis', 'share-answer', 'clear-all']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('inclui progresso detalhado e cancelamento', () => {
  assert.match(html, /Preparando imagem/);
  assert.match(html, /Tentando modelo alternativo/);
  assert.match(html, /id="cancel-analysis"/);
  assert.match(app, /analysisController\?\.abort/);
});

test('publica PWA sem armazenar a API em cache', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
  assert.match(sw, /\/api\//);
  assert.match(sw, /return;/);
  assert.doesNotMatch(sw, /APP_SHELL[^;]*api\/v1/s);
});

test('backend usa contratos especializados na release da Fase 19', () => {
  assert.match(api, /buildExpertPrompt/);
  assert.match(profiles, /TRUTH_POLICY/);
  assert.match(profiles, /trader-complete-analysis/);
  assert.match(config, /phase-19-intent-trader-v2/);
});

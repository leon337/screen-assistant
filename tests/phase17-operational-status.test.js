import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const statusApi = await readFile(new URL('api/v1/status.js', root), 'utf8');
const statusClient = await readFile(new URL('public/status.js', root), 'utf8');
const statusStyles = await readFile(new URL('public/status.css', root), 'utf8');
const design = await readFile(new URL('public/design.js', root), 'utf8');
const serviceWorker = await readFile(new URL('public/service-worker.js', root), 'utf8');
const config = await readFile(new URL('src/server/config.js', root), 'utf8');

test('endpoint expõe apenas estado e não expõe segredos', () => {
  assert.match(statusApi, /accessConfigured/);
  assert.match(statusApi, /providerConfigured/);
  assert.match(statusApi, /cache-control.*no-store/s);
  assert.doesNotMatch(statusApi, /accessToken\s*:/);
  assert.doesNotMatch(statusApi, /geminiApiKey\s*:/);
});

test('painel operacional permanece visível e atualizável', () => {
  assert.match(statusClient, /Estado da aplicação/);
  assert.match(statusClient, /Atualizar estado/);
  assert.match(statusClient, /aria-live/);
  assert.match(statusClient, /PREVIEW_ACCESS_TOKEN/);
  assert.match(statusClient, /fetch\('\/api\/v1\/status'/);
  assert.match(statusStyles, /operations-grid/);
});

test('carrega o painel sem alterar a jornada principal', () => {
  assert.match(design, /import ['"]\.\/status\.js['"]/);
  assert.match(serviceWorker, /status\.js/);
  assert.match(serviceWorker, /status\.css/);
});

test('preserva o painel da Fase 17 na release premium da Fase 18 R2', () => {
  assert.match(config, /phase-18-mobile-premium-r2/);
  assert.match(serviceWorker, /screen-assistant-v18-r2/);
});

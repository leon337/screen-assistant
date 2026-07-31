import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/index.html', root), 'utf8');
const styles = await readFile(new URL('public/styles.css', root), 'utf8');
const design = await readFile(new URL('public/design.js', root), 'utf8');
const sw = await readFile(new URL('public/service-worker.js', root), 'utf8');
const manifest = JSON.parse(await readFile(new URL('public/manifest.webmanifest', root), 'utf8'));

test('aplica identidade visual da Fase 15', () => {
  assert.match(html, /Predix AI Lab/);
  assert.match(html, /class="brand-mark"/);
  assert.match(styles, /--primary:/);
  assert.match(styles, /--cyan:/);
  assert.match(styles, /--radius-lg:/);
});

test('destaca a jornada principal sem remover funcionalidades', () => {
  assert.match(html, /O que você quer analisar\?/);
  assert.match(html, /class="source-picker"/);
  assert.match(html, /id="open-camera"/);
  assert.match(html, /id="open-gallery"/);
  assert.match(html, /id="analyze"/);
  assert.match(html, /id="screen-panel"/);
});

test('organiza ações da resposta por prioridade', () => {
  assert.match(html, /class="response-actions"/);
  assert.match(html, /class="quick-actions"/);
  assert.match(html, /class="more-actions"/);
  for (const id of ['new-analysis', 'copy-answer', 'speak-answer', 'share-answer', 'change-image', 'repeat-analysis', 'clear-all']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('sincroniza estado vazio da resposta', () => {
  assert.match(html, /src="\/design\.js"/);
  assert.match(design, /MutationObserver/);
  assert.match(design, /answer-empty/);
});

test('atualiza PWA sem armazenar chamadas de API', () => {
  assert.equal(manifest.theme_color, '#090d1a');
  assert.equal(manifest.background_color, '#090d1a');
  assert.match(sw, /screen-assistant-v15/);
  assert.match(sw, /design\.js/);
  assert.match(sw, /pathname\.startsWith\('\/api\/'\)/);
});

test('mantém acessibilidade visual básica', () => {
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(html, /aria-label="Aviso de privacidade"/);
  assert.match(html, /aria-live="polite"/);
});

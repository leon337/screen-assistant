import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('public/index.html', root), 'utf8');
const app = await readFile(new URL('public/app.js', root), 'utf8');
const config = await readFile(new URL('src/server/config.js', root), 'utf8');

test('oferece câmera traseira e galeria no mobile', () => {
  assert.match(html, /id="camera-input"[^>]*capture="environment"/);
  assert.match(html, /id="gallery-input"[^>]*accept="image\/\*"/);
  assert.match(html, />Tirar foto</);
  assert.match(html, />Escolher imagem</);
});

test('preserva captura de tela no desktop', () => {
  assert.match(app, /getDisplayMedia/);
  assert.match(html, />Compartilhar tela</);
  assert.match(html, />Capturar frame</);
});

test('comprime a imagem antes do envio e limita a 2 MB', () => {
  assert.match(app, /compressImageFile/);
  assert.match(app, /2 \* 1024 \* 1024/);
  assert.match(config, /2097152|2\s*\*\s*1024\s*\*\s*1024/);
});

test('publica o release premium da Fase 18 R2', () => {
  assert.match(config, /phase-18-mobile-premium-r2/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const design = await readFile(new URL('public/design.js', root), 'utf8');
const mobileClient = await readFile(new URL('public/mobile-v18.js', root), 'utf8');
const mobileStyles = await readFile(new URL('public/mobile-v18.css', root), 'utf8');
const serviceWorker = await readFile(new URL('public/service-worker.js', root), 'utf8');
const config = await readFile(new URL('src/server/config.js', root), 'utf8');

test('carrega o refinamento mobile sem substituir a interface principal', () => {
  assert.match(design, /import ['"]\.\/mobile-v18\.js['"]/);
  assert.match(mobileClient, /mobile-v18\.css/);
  assert.match(mobileClient, /data\.mobileDesign|dataset\.mobileDesign/);
});

test('evita que a barra móvel cubra resultado e teclado', () => {
  assert.match(mobileClient, /IntersectionObserver/);
  assert.match(mobileClient, /visualViewport/);
  assert.match(mobileClient, /mobile-reading-result/);
  assert.match(mobileClient, /mobile-keyboard-open/);
  assert.match(mobileStyles, /pointer-events:\s*none/);
  assert.match(mobileStyles, /safe-area-inset-bottom/);
});

test('compacta a jornada no celular sem remover recursos do desktop', () => {
  assert.match(mobileStyles, /body\[data-layout="compact"\]\s+#screen-panel/);
  assert.match(mobileStyles, /grid-template-columns:\s*repeat\(2/);
  assert.match(mobileStyles, /min-height:\s*44px/);
  assert.doesNotMatch(mobileClient, /remove\(\)|removeChild/);
});

test('publica assets e release da Fase 18 no PWA', () => {
  assert.match(serviceWorker, /screen-assistant-v18/);
  assert.match(serviceWorker, /mobile-v18\.css/);
  assert.match(serviceWorker, /mobile-v18\.js/);
  assert.match(config, /phase-18-mobile-design-polish/);
});

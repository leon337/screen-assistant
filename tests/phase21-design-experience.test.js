import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const designJs = read('public/design-v21.js');
const designCss = read('public/design-v21.css');
const authCss = read('public/auth-v21.css');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('fase 21 cria jornada de imagem, objetivo e resultado', () => {
  assert.match(designJs, /data-v21-step="image"/);
  assert.match(designJs, /data-v21-step="intent"/);
  assert.match(designJs, /data-v21-step="result"/);
});

test('objetivos recebem linguagem visual consistente', () => {
  for (const intent of ['explain', 'diagnose', 'architecture', 'ux', 'trader']) {
    assert.match(designJs, new RegExp(`${intent}:`));
  }
  assert.match(designJs, /design-v21-intent-icon/);
});

test('barra móvel não duplica seleção de imagem antes da escolha', () => {
  assert.match(designCss, /not\(\.v19-has-image\) #mobile-action-bar/);
  assert.match(designCss, /v19-has-image #bar-camera/);
  assert.match(designCss, /v19-has-image #bar-gallery/);
});

test('resultado só aparece na navegação quando existe resposta', () => {
  assert.match(designCss, /not\(\.v19-has-answer\) \[data-premium-route="result"\]/);
});

test('acessibilidade inclui foco e redução de movimento', () => {
  assert.match(designCss, /:focus-visible/);
  assert.match(designCss, /prefers-reduced-motion/);
  assert.match(authCss, /:focus-visible/);
});

test('carregador inclui os estilos e o módulo da fase 21', () => {
  assert.match(loader, /auth-v21\.css/);
  assert.match(loader, /design-v21\.css/);
  assert.match(loader, /design-v21\.js/);
});

test('PWA versiona e guarda os novos assets', () => {
  assert.match(serviceWorker, /screen-assistant-v21-design-experience/);
  assert.match(serviceWorker, /design-v21\.js/);
  assert.match(serviceWorker, /design-v21\.css/);
  assert.match(serviceWorker, /auth-v21\.css/);
});

test('camada visual não observa nem modifica a tela de login', () => {
  assert.match(designJs, /document\.body\.dataset\.authState !== 'authenticated'/);
  assert.match(designJs, /waitForAuthentication/);
  assert.match(designJs, /attributeFilter: \['data-auth-state'\]/);
  assert.match(designJs, /authObserver\.disconnect\(\)/);
});

test('sincronização visual evita reescritas contínuas do DOM', () => {
  assert.match(designJs, /function setText\(/);
  assert.match(designJs, /element\.textContent !== value/);
  assert.match(designJs, /function setHtml\(/);
  assert.match(designJs, /element\.innerHTML !== value/);
  assert.match(designJs, /requestAnimationFrame\(run\)/);
});

test('hotfix do login invalida o cache PWA anterior', () => {
  assert.match(serviceWorker, /screen-assistant-v21-design-experience-hotfix-1/);
  assert.match(serviceWorker, /keys\.filter\(\(key\) => key !== CACHE\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const analysis = read('public/analysis.js');
const access = read('public/pilot-access-v19.js');
const styles = read('public/pilot-access-v19.css');
const serviceWorker = read('public/service-worker.js');

test('análise não usa prompts nativos do navegador', () => {
  assert.doesNotMatch(analysis, /window\.prompt/);
  assert.doesNotMatch(analysis, /window\.confirm/);
  assert.match(analysis, /ensurePilotAccess/);
});

test('acesso integrado reúne código e consentimento de privacidade', () => {
  assert.match(access, /Código de acesso/);
  assert.match(access, /privacyConsent/);
  assert.match(access, /enviada ao Gemini/i);
  assert.match(access, /sessionStorage\.setItem/);
});

test('código inválido é removido para permitir nova tentativa', () => {
  assert.match(analysis, /response\.status === 401/);
  assert.match(analysis, /clearPilotAccess\(\)/);
  assert.match(analysis, /Código de acesso inválido/);
});

test('modal possui tratamento responsivo para celular', () => {
  assert.match(styles, /pilot-access-dialog/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /100dvh/);
});

test('PWA inclui os arquivos do acesso integrado', () => {
  assert.match(serviceWorker, /pilot-access-v19\.js/);
  assert.match(serviceWorker, /pilot-access-v19\.css/);
  assert.match(serviceWorker, /screen-assistant-v19-access/);
});

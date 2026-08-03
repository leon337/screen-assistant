import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const moduleSource = read('public/voice-v24a.js');
const styles = read('public/voice-v24a.css');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('módulo da Fase 24A possui JavaScript válido', () => {
  assert.doesNotThrow(() => new Function(moduleSource));
});

test('Fase 24A é carregada no runtime e publicada pela PWA', () => {
  assert.match(loader, /voice-v24a\.css/);
  assert.match(loader, /voice-v24a\.js/);
  assert.match(serviceWorker, /screen-assistant-v24a-voice-design/);
  assert.match(serviceWorker, /voice-v24a\.css/);
  assert.match(serviceWorker, /voice-v24a\.js/);
});

test('barra compacta separa microfone leitura velocidade e ajustes', () => {
  assert.match(moduleSource, /voice-dock-v24a/);
  assert.match(moduleSource, /voice-mic-state-v24a/);
  assert.match(moduleSource, /voice-speech-state-v24a/);
  assert.match(moduleSource, /voice-rate-v24a/);
  assert.match(moduleSource, /voice-settings-open-v24a/);
});

test('botão de leitura alterna entre ouvir e parar', () => {
  assert.match(moduleSource, /speaking \? '■ Parar' : '▶ Ouvir'/);
  assert.match(moduleSource, /if \(isSpeaking\(\)\) triggerLegacy\(ui\.legacyStop\)/);
  assert.match(moduleSource, /else triggerLegacy\(ui\.legacySpeak\)/);
});

test('painel antigo é movido para folha de ajustes sem duplicar eventos', () => {
  assert.match(moduleSource, /append\(legacyBody\)/);
  assert.match(moduleSource, /legacyPanel\.hidden = true/);
  assert.doesNotMatch(moduleSource, /cloneNode/);
  assert.match(moduleSource, /showModal/);
});

test('vozes pt-BR recebem nome curto e detalhe separado', () => {
  assert.match(moduleSource, /function shortVoiceName/);
  assert.match(moduleSource, /option\.dataset\.fullLabel/);
  assert.match(moduleSource, /Português \(Brasil\)/);
  assert.match(moduleSource, /MutationObserver\(updateVoiceLabels\)/);
});

test('ações duplicadas são removidas no mobile', () => {
  assert.match(styles, /\.response-actions #speak-answer/);
  assert.match(styles, /\.response-actions #stop-voice/);
  assert.match(styles, /\.voice-command-toggle-v23/);
  assert.match(styles, /display: none !important/);
});

test('folha possui backdrop, fechamento e área rolável', () => {
  assert.match(styles, /\.voice-sheet-v24a::backdrop/);
  assert.match(moduleSource, /voice-sheet-close-v24a/);
  assert.match(moduleSource, /event\.target === ui\.sheet/);
  assert.match(styles, /overflow-y: auto/);
});

test('layout móvel reserva espaço para barra fixa', () => {
  assert.match(styles, /padding-bottom: calc\(10\.5rem/);
  assert.match(styles, /position: fixed/);
  assert.match(styles, /safe-area-inset-bottom/);
});

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
  assert.match(loader, /natural-voice-v24a\.js/);
  assert.match(serviceWorker, /screen-assistant-v24a-natural-voice-rc3/);
  assert.match(serviceWorker, /voice-v24a\.css/);
  assert.match(serviceWorker, /voice-v24a\.js/);
  assert.match(serviceWorker, /natural-voice-v24a\.js/);
});

test('barra compacta mantém quatro controles em uma linha', () => {
  assert.match(moduleSource, /voice-mic-v24a/);
  assert.match(moduleSource, /voice-speech-v24a/);
  assert.match(moduleSource, /voice-rate-v24a/);
  assert.match(moduleSource, /voice-settings-open-v24a/);
  assert.match(styles, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
});

test('barra aparece somente em resultado pronto', () => {
  assert.match(moduleSource, /document\.body\.dataset\.premiumScreen === 'result'/);
  assert.match(moduleSource, /answerReady\(\)/);
  assert.match(moduleSource, /ui\.dock\.hidden = !shouldShowDock\(\)/);
  assert.match(moduleSource, /aria-busy/);
});

test('layout móvel não usa sobreposição fixa', () => {
  assert.doesNotMatch(styles, /position:\s*fixed/);
  assert.doesNotMatch(styles, /padding-bottom:\s*calc\(10\.5rem/);
  assert.match(styles, /\.voice-dock-v24a\s*\{[\s\S]*width: 100%/);
  assert.match(styles, /overflow-x: hidden/);
});

test('botão de leitura integra voz natural e fallback local', () => {
  assert.match(moduleSource, /natural\.speakAnswer\(\)/);
  assert.match(moduleSource, /if \(!handled\) triggerLegacy\(ui\.legacySpeak\)/);
  assert.match(moduleSource, /natural\.stop/);
  assert.match(moduleSource, /window\.speechSynthesis\?\.speaking/);
});

test('painel antigo é movido para folha sem duplicar eventos', () => {
  assert.match(moduleSource, /append\(legacyBody\)/);
  assert.match(moduleSource, /legacyPanel\.hidden = true/);
  assert.doesNotMatch(moduleSource, /cloneNode/);
  assert.match(moduleSource, /showModal/);
});

test('uma única voz local não mantém seletor redundante', () => {
  assert.match(moduleSource, /const onlyOneVoice = ui\.voiceSelect\.options\.length <= 1/);
  assert.match(moduleSource, /ui\.voiceSelect\.hidden = onlyOneVoice/);
  assert.match(moduleSource, /Voz do aparelho/);
});

test('ações antigas duplicadas são removidas no mobile', () => {
  assert.match(styles, /\.response-actions #speak-answer/);
  assert.match(styles, /\.response-actions #stop-voice/);
  assert.match(styles, /\.voice-command-toggle-v23/);
  assert.match(styles, /display: none !important/);
});

test('folha possui altura limitada, backdrop e fechamento acessível', () => {
  assert.match(styles, /max-height: min\(75dvh/);
  assert.match(styles, /max-height: 75dvh/);
  assert.match(styles, /\.voice-sheet-v24a::backdrop/);
  assert.match(moduleSource, /voice-sheet-close-v24a/);
  assert.match(moduleSource, /event\.target === ui\.sheet/);
  assert.match(styles, /overflow-y: auto/);
});

test('estado de leitura usa eventos em vez de sondagem contínua', () => {
  assert.match(moduleSource, /screen-assistant-natural-voice-change/);
  assert.doesNotMatch(moduleSource, /setInterval/);
  assert.match(moduleSource, /MutationObserver/);
});

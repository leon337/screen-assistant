import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const voice = read('public/voice-v23.js');
const styles = read('public/voice-v23.css');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');
const vercel = read('vercel.json');

test('módulo de voz possui JavaScript sintaticamente válido', () => {
  assert.doesNotThrow(() => new Function(voice));
});

test('fase 23 é carregada pelo runtime e publicada na PWA', () => {
  assert.match(loader, /voice-v23\.css/);
  assert.match(loader, /voice-v23\.js/);
  assert.match(serviceWorker, /screen-assistant-v23-voice-controls/);
  assert.match(serviceWorker, /voice-v23\.css/);
  assert.match(serviceWorker, /voice-v23\.js/);
});

test('velocidade possui faixa legível e preferência local', () => {
  assert.match(voice, /RATE_MIN = 0\.6/);
  assert.match(voice, /RATE_MAX = 1\.6/);
  assert.match(voice, /RATE_STEP = 0\.1/);
  assert.match(voice, /screen-assistant-voice-v23/);
  assert.match(voice, /rate: state\.rate/);
  assert.match(styles, /#voice-rate-v23/);
});

test('vozes ficam restritas ao português do Brasil', () => {
  assert.match(voice, /TARGET_LANGUAGE = 'pt-BR'/);
  assert.match(voice, /replace\(\/_\/g, '-'\)/);
  assert.match(voice, /language === 'pt-br'/);
  assert.match(voice, /language\.startsWith\('pt-br-'\)/);
  assert.match(voice, /filter\(isBrazilianPortugueseVoice\)/);
  assert.match(voice, /Voz em português \(Brasil\)/);
  assert.match(voice, /Somente vozes pt-BR são exibidas/);
  assert.doesNotMatch(voice, /portuguese\.length \? portuguese : voices/);
  assert.doesNotMatch(voice, /return voices;/);
});

test('preferência antiga incompatível não é reutilizada', () => {
  assert.match(voice, /voices\.find\(\(voice\) => voice\.voiceURI === previousVoiceURI\)/);
  assert.match(voice, /state\.voiceURI = ''/);
  assert.match(voice, /selectedVoice && isBrazilianPortugueseVoice\(selectedVoice\)/);
});

test('microfone começa desligado e exige ativação explícita', () => {
  assert.match(voice, /let commandsArmed = false/);
  assert.match(voice, /Ativar comandos de voz/);
  assert.match(voice, /ui\.topToggle\.addEventListener\('click', toggleCommands\)/);
  assert.doesNotMatch(voice, /commandsArmed:\s*state/);
  assert.doesNotMatch(voice, /commandsArmed\s*\}/);
});

test('política HTTP permite microfone somente para a própria aplicação', () => {
  assert.match(vercel, /camera=\(self\), microphone=\(self\), geolocation=\(\)/);
  assert.doesNotMatch(vercel, /microphone=\(\)/);
});

test('wake phrase e janela de segundo comando são implementadas', () => {
  assert.match(voice, /screen assistant\\b/);
  assert.match(voice, /screen assistente\\b/);
  assert.match(voice, /scrim assistente\\b/);
  assert.match(voice, /WAKE_WINDOW_MS = 8000/);
  assert.match(voice, /Date\.now\(\) <= wakeUntil/);
});

test('reconhecimento móvel usa sessões curtas e alternativas', () => {
  assert.match(voice, /instance\.lang = TARGET_LANGUAGE/);
  assert.match(voice, /instance\.continuous = false/);
  assert.match(voice, /instance\.maxAlternatives = 5/);
  assert.match(voice, /function chooseTranscript/);
  assert.match(voice, /splitWakePhrase\(transcript\) !== null/);
  assert.match(voice, /scheduleRecognitionRestart/);
});

test('comandos controlam leitura velocidade e análise', () => {
  assert.match(voice, /ler resposta/);
  assert.match(voice, /mais rapido/);
  assert.match(voice, /mais devagar/);
  assert.match(voice, /velocidade normal/);
  assert.match(voice, /nova analise/);
  assert.match(voice, /repetir analise/);
  assert.match(voice, /analisar imagem/);
});

test('leitura antiga é interceptada sem duplicar a fala', () => {
  assert.match(voice, /target\.id === 'speak-answer'/);
  assert.match(voice, /target\.id === 'stop-voice'/);
  assert.match(voice, /stopImmediatePropagation\(\)/);
  assert.match(voice, /document\.addEventListener\('click',[\s\S]*true\)/);
});

test('microfone é desligado quando a página deixa o primeiro plano', () => {
  assert.match(voice, /document\.addEventListener\('visibilitychange'/);
  assert.match(voice, /document\.visibilityState === 'hidden'/);
  assert.match(voice, /window\.addEventListener\('beforeunload'/);
});

test('interface oferece feedback acessível e alvos móveis', () => {
  assert.match(voice, /aria-live="polite"/);
  assert.match(voice, /aria-pressed/);
  assert.match(voice, /voice-command-status-v23/);
  assert.match(styles, /min-height: 3rem/);
  assert.match(styles, /prefers-reduced-motion/);
});

test('comandos não tentam abrir câmera ou galeria do sistema', () => {
  const commandSection = voice.match(/function executeCommand[\s\S]*?function splitWakePhrase/)?.[0] || '';
  assert.doesNotMatch(commandSection, /open-camera/);
  assert.doesNotMatch(commandSection, /open-gallery/);
  assert.doesNotMatch(commandSection, /camera-input/);
  assert.doesNotMatch(commandSection, /gallery-input/);
});

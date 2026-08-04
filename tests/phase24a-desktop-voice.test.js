import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const endpoint = read('api/v1/transcribe-command.js');
const provider = read('src/server/providers/gemini-command-audio.js');
const client = read('public/voice-desktop-v24a.js');
const css = read('public/voice-desktop-v24a.css');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');
const config = read('src/server/config.js');

test('módulo desktop possui JavaScript sintaticamente válido', () => {
  execFileSync(process.execPath, ['--check', new URL('../public/voice-desktop-v24a.js', import.meta.url).pathname]);
  execFileSync(process.execPath, ['--check', new URL('../api/v1/transcribe-command.js', import.meta.url).pathname]);
  execFileSync(process.execPath, ['--check', new URL('../src/server/providers/gemini-command-audio.js', import.meta.url).pathname]);
});

test('endpoint exige autenticação e limite separado por usuário e IP', () => {
  assert.match(endpoint, /authenticateRequest/);
  assert.match(endpoint, /voice-command:\$\{authentication\.user\.id\}:\$\{ip\}/);
  assert.match(endpoint, /voiceCommandRateLimitMax/);
  assert.match(endpoint, /VOICE_COMMAND_RATE_LIMIT_USER/);
});

test('endpoint limita tipo e tamanho do áudio', () => {
  assert.match(endpoint, /SUPPORTED_AUDIO_TYPES/);
  assert.match(endpoint, /audio\/webm/);
  assert.match(endpoint, /audio\/ogg/);
  assert.match(endpoint, /maxVoiceCommandBytes/);
  assert.match(endpoint, /VOICE_COMMAND_AUDIO_TOO_LARGE/);
});

test('provedor envia áudio inline sem expor chave no navegador', () => {
  assert.match(provider, /inlineData/);
  assert.match(provider, /mimeType: audio\.type/);
  assert.match(provider, /x-goog-api-key/);
  assert.match(provider, /geminiModel/);
  assert.doesNotMatch(client, /GEMINI_API_KEY|x-goog-api-key/);
});

test('desktop usa gravação curta e push-to-talk', () => {
  assert.match(client, /MAX_RECORDING_MS = 6000/);
  assert.match(client, /getUserMedia/);
  assert.match(client, /new MediaRecorder/);
  assert.match(client, /transcribe-command/);
  assert.match(client, /stopImmediatePropagation/);
});

test('comandos curtos dispensam wake word obrigatória', () => {
  assert.match(client, /\^\(ler\|ouvir\)/);
  assert.match(client, /\^\(parar\|pare\|interromper\)/);
  assert.match(client, /\^\(analisar\|analise\|analisar imagem\)/);
  assert.match(client, /\^\(novo\|nova\|nova analise\|outra imagem\)/);
  assert.match(client, /Não precisa falar “Screen Assistente”/);
});

test('leitura desktop usa o player neural universal', () => {
  assert.match(client, /window\.screenAssistantNaturalVoice/);
  assert.match(client, /natural\?\.speakAnswer/);
  assert.match(client, /natural\.stop/);
  assert.match(css, /response-actions #speak-answer/);
  assert.match(css, /display: none !important/);
});

test('runtime e PWA publicam a camada desktop sem armazenar a API', () => {
  assert.match(loader, /voice-desktop-v24a\.css/);
  assert.match(loader, /voice-desktop-v24a\.js/);
  assert.match(loader, /dataset\.voiceDesktop = 'ready'/);
  assert.match(serviceWorker, /screen-assistant-v24a-desktop-voice-1/);
  assert.match(serviceWorker, /voice-desktop-v24a\.js/);
  assert.match(serviceWorker, /voice-desktop-v24a\.css/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.doesNotMatch(serviceWorker, /transcribe-command/);
});

test('configuração define limites próprios para comandos de voz', () => {
  assert.match(config, /maxVoiceCommandBytes/);
  assert.match(config, /voiceCommandTimeoutMs/);
  assert.match(config, /voiceCommandRateLimitMax/);
  assert.match(config, /voiceCommandRateLimitWindowMs/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const endpointPath = new URL('../api/v1/synthesize-speech-stream.js', import.meta.url);
const clientPath = new URL('../public/voice-desktop-playback-safety-v24a.js', import.meta.url);
const endpoint = read('api/v1/synthesize-speech-stream.js');
const client = read('public/voice-desktop-playback-safety-v24a.js');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('módulos do hotfix possuem JavaScript sintaticamente válido', () => {
  for (const path of [endpointPath, clientPath]) {
    const result = spawnSync(process.execPath, ['--check', path.pathname], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('endpoint usa o contrato oficial de áudio sem mime_type incompatível', () => {
  assert.match(endpoint, /response_format:\s*\{\s*type: 'audio',?\s*\}/s);
  assert.doesNotMatch(endpoint, /mime_type:\s*'audio\/l16'/);
  assert.doesNotMatch(endpoint, /delivery:\s*'inline'/);
  assert.match(endpoint, /stream:\s*true/);
});

test('player seguro usa somente a rota progressiva por tentativa', () => {
  assert.match(client, /fetch\('\/api\/v1\/synthesize-speech-stream'/);
  assert.doesNotMatch(client, /fetch\('\/api\/v1\/synthesize-speech'/);
  assert.match(client, /preload:\s*\(\) => Promise\.resolve\(null\)/);
});

test('player não acumula todo o PCM a cada bloco', () => {
  assert.doesNotMatch(client, /collectedBytes/);
  assert.doesNotMatch(client, /concatBytes\(collected/);
  assert.match(client, /PCM_SLICE_BYTES/);
  assert.match(client, /await yieldToBrowser\(\)/);
});

test('streaming possui limites de primeiro áudio e requisição total', () => {
  assert.match(client, /FIRST_AUDIO_TIMEOUT_MS = 7000/);
  assert.match(client, /REQUEST_TIMEOUT_MS = 20000/);
  assert.match(client, /firstAudioTimeout = window\.setTimeout/);
  assert.match(client, /requestTimeout = window\.setTimeout/);
  assert.match(client, /requestController\?\.abort\(\)/);
});

test('falhas e cota retornam para voz local segmentada', () => {
  assert.match(client, /status === 429/);
  assert.match(client, /setCooldown\(\)/);
  assert.match(client, /QUOTA_COOLDOWN_MS/);
  assert.match(client, /splitForLocalSpeech/);
  assert.match(client, /LOCAL_CHUNK_LIMIT = 650/);
  assert.match(client, /new SpeechSynthesisUtterance/);
});

test('leitura cancela o microfone antes de iniciar', () => {
  assert.match(client, /window\.screenAssistantDesktopVoice\?\.cancel\?\.\(\)/);
  assert.match(client, /cancelMicrophone\(\)/);
  assert.match(client, /stopSafePlayback\(\{ announce: false \}\);\s*const version = runVersion;\s*cancelMicrophone\(\)/s);
});

test('runtime carrega segurança depois da estabilidade do microfone', () => {
  const stabilityIndex = loader.indexOf("import('./voice-desktop-stability-v24a.js')");
  const playbackIndex = loader.indexOf("import('./voice-desktop-playback-safety-v24a.js')");
  assert.ok(stabilityIndex >= 0);
  assert.ok(playbackIndex > stabilityIndex);
  assert.match(loader, /voiceDesktopPlayback = 'safe'/);
});

test('PWA publica nova geração e mantém API fora do cache', () => {
  assert.match(serviceWorker, /screen-assistant-v24a-desktop-playback-safety-1/);
  assert.match(serviceWorker, /voice-desktop-playback-safety-v24a\.js/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.doesNotMatch(serviceWorker, /'\/api\/v1\/synthesize-speech-stream'/);
});

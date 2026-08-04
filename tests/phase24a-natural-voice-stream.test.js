import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const endpoint = read('api/v1/synthesize-speech-stream.js');
const client = read('public/natural-voice-stream-v24a.js');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('endpoint progressivo exige autenticação e limite próprio', () => {
  assert.match(endpoint, /authenticateRequest/);
  assert.match(endpoint, /speech-stream:\$\{authentication\.user\.id\}/);
  assert.match(endpoint, /speechRateLimitMax/);
  assert.match(endpoint, /TTS_RATE_LIMIT_USER/);
});

test('endpoint usa streaming oficial do Gemini TTS 3.1', () => {
  assert.match(endpoint, /\/v1beta\/interactions\?alt=sse/);
  assert.match(endpoint, /api-revision': API_REVISION/);
  assert.match(endpoint, /stream: true/);
  assert.match(endpoint, /type: 'audio'/);
  assert.match(endpoint, /mime_type: 'audio\/l16'/);
  assert.match(endpoint, /speech_config: \[\{ voice:/);
});

test('proxy preserva SSE e impede cache intermediário', () => {
  assert.match(endpoint, /text\/event-stream/);
  assert.match(endpoint, /no-store, no-transform/);
  assert.match(endpoint, /x-accel-buffering': 'no'/);
  assert.match(endpoint, /new Response\(providerResponse\.body/);
});

test('cliente inicia com buffer curto usando Web Audio', () => {
  assert.match(client, /START_BUFFER_BYTES = Math\.round\(SAMPLE_RATE \* SAMPLE_WIDTH \* 0\.24\)/);
  assert.match(client, /window\.AudioContext \|\| window\.webkitAudioContext/);
  assert.match(client, /createBufferSource/);
  assert.match(client, /source\.start\(startAt\)/);
});

test('cliente processa eventos SSE de áudio incremental', () => {
  assert.match(client, /response\.body\.getReader\(\)/);
  assert.match(client, /parseSseBlock/);
  assert.match(client, /event\?\.event_type === 'step\.delta'/);
  assert.match(client, /delta\?\.type === 'audio'/);
  assert.match(client, /scheduleBytes\(bytes\)/);
});

test('streaming mantém cancelamento e fallback completo', () => {
  assert.match(client, /streamController = new AbortController\(\)/);
  assert.match(client, /streamController\?\.abort\(\)/);
  assert.match(client, /Streaming TTS indisponível; usando geração completa/);
  assert.match(client, /legacy\?\.speakAnswer\?\.\(\)/);
});

test('PCM concluído fica apenas em memória e é reutilizado', () => {
  assert.match(client, /let streamCache = null/);
  assert.match(client, /streamCache = \{ key: speechKey\(text\), bytes: collectedBytes \}/);
  assert.match(client, /playCachedStream\(streamCache\.bytes\)/);
  assert.doesNotMatch(client, /localStorage\.setItem/);
  assert.doesNotMatch(client, /indexedDB/);
  assert.doesNotMatch(client, /caches\.open/);
});

test('runtime e PWA publicam o streaming sem armazenar a API', () => {
  assert.match(loader, /natural-voice-stream-v24a\.js/);
  assert.match(loader, /dataset\.voiceStreaming = 'ready'/);
  assert.match(serviceWorker, /natural-voice-stream-v24a\.js/);
  assert.match(serviceWorker, /screen-assistant-v24a-natural-voice-stream-1/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.doesNotMatch(serviceWorker, /synthesize-speech-stream/);
});

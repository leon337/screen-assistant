import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { synthesizeWithGeminiTts, ttsInternals } from '../src/server/providers/gemini-tts.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const endpoint = read('api/v1/synthesize-speech.js');
const client = read('public/natural-voice-v24a.js');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');
const configSource = read('src/server/config.js');

const baseConfig = Object.freeze({
  geminiApiKey: 'test-key-not-real',
  geminiTtsModel: 'gemini-3.1-flash-tts-preview',
  geminiTtsVoice: 'Sulafat',
  geminiTtsTimeoutMs: 2000,
  maxSpeechChars: 4000,
});

test('normalização remove Markdown técnico e preserva texto falado', () => {
  const normalized = ttsInternals.normalizeTranscript('## Título\n- **Valor:** `123`\n```js\nsegredo()\n```', 4000);
  assert.equal(normalized, 'Título\nValor: 123');
});

test('provedor envia modalidade de áudio e voz configurada', async () => {
  let capturedUrl = '';
  let capturedOptions;
  const fetchImpl = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ inlineData: {
        data: 'AQIDBA==',
        mimeType: 'audio/L16;codec=pcm;rate=24000',
      } }] } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const result = await synthesizeWithGeminiTts({
    config: baseConfig,
    text: 'Olá, esta é uma leitura natural.',
    requestId: 'req-test',
    fetchImpl,
  });

  const body = JSON.parse(capturedOptions.body);
  assert.match(capturedUrl, /gemini-3\.1-flash-tts-preview:generateContent/);
  assert.equal(capturedOptions.headers['x-goog-api-key'], baseConfig.geminiApiKey);
  assert.deepEqual(body.generationConfig.responseModalities, ['AUDIO']);
  assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Sulafat');
  assert.match(body.contents[0].parts[0].text, /português do Brasil neutro/);
  assert.equal(result.audioBase64, 'AQIDBA==');
  assert.equal(result.sampleRate, 24000);
  assert.equal(result.channels, 1);
  assert.equal(result.sampleWidth, 2);
});

test('provedor converte cota do Gemini em erro controlado', async () => {
  const result = await synthesizeWithGeminiTts({
    config: baseConfig,
    text: 'Teste.',
    requestId: 'req-rate',
    fetchImpl: async () => new Response(JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED' } }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    }),
    logger: { error() {} },
  });

  assert.equal(result.error.code, 'TTS_RATE_LIMIT');
  assert.equal(result.error.status, 429);
});

test('endpoint exige autenticação e possui rate limit próprio', () => {
  assert.match(endpoint, /authenticateRequest/);
  assert.match(endpoint, /speech:\$\{authentication\.user\.id\}/);
  assert.match(endpoint, /speechRateLimitMax/);
  assert.match(endpoint, /speechRateLimitWindowMs/);
  assert.match(endpoint, /TTS_TEXT_TOO_LONG/);
  assert.match(endpoint, /synthesizeWithGeminiTts/);
});

test('configuração mantém chave apenas no servidor e define TTS pt-BR', () => {
  assert.match(configSource, /GEMINI_TTS_MODEL/);
  assert.match(configSource, /gemini-3\.1-flash-tts-preview/);
  assert.match(configSource, /GEMINI_TTS_VOICE/);
  assert.match(configSource, /Sulafat/);
  assert.doesNotMatch(client, /GEMINI_API_KEY/);
  assert.doesNotMatch(client, /x-goog-api-key/);
});

test('cliente cria WAV local e controla velocidade sem nova síntese', () => {
  assert.match(client, /function writeAscii/);
  assert.match(client, /export function pcmBase64ToWavBlob/);
  assert.match(client, /writeAscii\(view, 0, 'RIFF'\)/);
  assert.match(client, /writeAscii\(view, 8, 'WAVE'\)/);
  assert.match(client, /player\.playbackRate = currentRate\(\)/);
  assert.match(client, /setNaturalPlaybackRate/);
});

test('cliente usa rota autenticada e fallback local', () => {
  assert.match(client, /fetch\('\/api\/v1\/synthesize-speech'/);
  assert.match(client, /authorization: `Bearer \$\{accessToken\}`/);
  assert.match(client, /document\.getElementById\('speak-answer'\)\?\.click\(\)/);
  assert.match(client, /Usando a voz do aparelho/);
});

test('modo natural é padrão e dispositivo continua disponível', () => {
  assert.match(client, /mode: 'natural'/);
  assert.match(client, /parsed\.mode === 'device'/);
  assert.match(client, /data-natural-voice-mode="natural"/);
  assert.match(client, /data-natural-voice-mode="device"/);
  assert.match(client, /screen-assistant-natural-voice-v24a/);
});

test('runtime e PWA publicam o player, mas não armazenam API ou áudio', () => {
  assert.match(loader, /natural-voice-v24a\.js/);
  assert.match(loader, /dataset\.voiceNatural = 'ready'/);
  assert.match(serviceWorker, /natural-voice-v24a\.js/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.doesNotMatch(serviceWorker, /synthesize-speech/);
});

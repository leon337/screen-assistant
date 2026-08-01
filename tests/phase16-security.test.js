import test from 'node:test';
import assert from 'node:assert/strict';

import { authorizeRequest, readBearer } from '../src/server/auth.js';
import { loadConfig, validateConfig } from '../src/server/config.js';
import { clearRateLimitsForTests, consumeRateLimit } from '../src/server/rate-limit.js';
import { validateAnalysisInput } from '../src/server/validation.js';

test('autenticação rejeita ausência e token arbitrário', () => {
  const expected = 'codigo-fechado-com-mais-de-16';
  assert.equal(authorizeRequest(new Request('https://example.test'), expected), false);
  assert.equal(authorizeRequest(new Request('https://example.test', {
    headers: { authorization: 'Bearer qualquer-coisa' },
  }), expected), false);
});

test('autenticação aceita somente credencial exata', () => {
  const expected = 'codigo-fechado-com-mais-de-16';
  const request = new Request('https://example.test', {
    headers: { authorization: `Bearer ${expected}` },
  });
  assert.equal(readBearer(request), expected);
  assert.equal(authorizeRequest(request, expected), true);
});

test('configuração usa limites seguros e timeout configurável', () => {
  const config = loadConfig({
    APP_RELEASE: 'phase-16-test', PREVIEW_ACCESS_TOKEN: '1234567890123456',
    AI_MODE: 'gemini', GEMINI_API_KEY: '1234567890', GEMINI_TIMEOUT_MS: '12000',
    MAX_QUESTION_CHARS: '500', RATE_LIMIT_MAX: '3', RATE_LIMIT_WINDOW_MS: '10000',
  });
  assert.equal(config.geminiTimeoutMs, 12000);
  assert.equal(config.maxQuestionChars, 500);
  assert.equal(config.rateLimitMax, 3);
  assert.deepEqual(validateConfig(config), []);
});

test('rate limit bloqueia após o máximo e reabre em nova janela', () => {
  clearRateLimitsForTests();
  const policy = { max: 2, windowMs: 1000 };
  assert.equal(consumeRateLimit('ip', policy, 0).allowed, true);
  assert.equal(consumeRateLimit('ip', policy, 10).allowed, true);
  assert.equal(consumeRateLimit('ip', policy, 20).allowed, false);
  assert.equal(consumeRateLimit('ip', policy, 1001).allowed, true);
});

test('validação rejeita pergunta longa, MIME inválido e imagem grande', () => {
  const config = { maxImageBytes: 10, maxQuestionChars: 5 };

  const longQuestion = new FormData();
  longQuestion.set('image', new File(['123'], 'image.jpg', { type: 'image/jpeg' }));
  longQuestion.set('question', '123456');
  assert.equal(validateAnalysisInput(longQuestion, config).error.code, 'QUESTION_TOO_LONG');

  const badMime = new FormData();
  badMime.set('image', new File(['123'], 'image.png', { type: 'image/png' }));
  assert.equal(validateAnalysisInput(badMime, config).error.code, 'IMAGE_FORMAT_INVALID');

  const large = new FormData();
  large.set('image', new File(['12345678901'], 'image.jpg', { type: 'image/jpeg' }));
  assert.equal(validateAnalysisInput(large, config).error.code, 'IMAGE_TOO_LARGE');
});

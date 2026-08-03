import test from 'node:test';
import assert from 'node:assert/strict';

import { authenticateRequest, readBearer } from '../src/server/auth.js';
import { loadConfig, validateConfig } from '../src/server/config.js';
import { clearRateLimitsForTests, consumeRateLimit } from '../src/server/rate-limit.js';
import { validateAnalysisInput } from '../src/server/validation.js';

const authConfig = loadConfig({
  APP_RELEASE: 'phase-20-test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_12345678901234567890',
  AI_MODE: 'gemini',
  GEMINI_API_KEY: '1234567890',
});

test('autenticação rejeita ausência de sessão', async () => {
  const result = await authenticateRequest(new Request('https://example.test'), authConfig, async () => {
    throw new Error('fetch não deveria ser chamado');
  });
  assert.equal(result.error.status, 401);
  assert.equal(result.error.code, 'AUTH_REQUIRED');
});

test('autenticação aceita somente usuário validado pelo Supabase', async () => {
  const request = new Request('https://example.test', {
    headers: { authorization: 'Bearer sessao-valida' },
  });
  assert.equal(readBearer(request), 'sessao-valida');

  const result = await authenticateRequest(request, authConfig, async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/user');
    assert.equal(options.headers.authorization, 'Bearer sessao-valida');
    return new Response(JSON.stringify({ id: 'user-1', email: 'user@example.com' }), { status: 200 });
  });
  assert.equal(result.user.id, 'user-1');
});

test('configuração usa limites seguros e timeout configurável', () => {
  const config = loadConfig({
    APP_RELEASE: 'phase-20-test',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_12345678901234567890',
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
  assert.equal(consumeRateLimit('user:ip', policy, 0).allowed, true);
  assert.equal(consumeRateLimit('user:ip', policy, 10).allowed, true);
  assert.equal(consumeRateLimit('user:ip', policy, 20).allowed, false);
  assert.equal(consumeRateLimit('user:ip', policy, 1001).allowed, true);
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

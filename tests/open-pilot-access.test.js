import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadConfig, validateConfig } from '../src/server/config.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const analysis = read('public/analysis.js');
const endpoint = read('api/v1/analyze-screen.js');

test('piloto aberto é o comportamento padrão', () => {
  const config = loadConfig({ AI_MODE: 'gemini', GEMINI_API_KEY: 'valid-test-key' });
  assert.equal(config.accessControlEnabled, false);
  assert.doesNotMatch(validateConfig(config).join(','), /PREVIEW_ACCESS_TOKEN/);
});

test('autenticação pode ser reativada por configuração', () => {
  const config = loadConfig({
    ACCESS_CONTROL_ENABLED: 'true',
    AI_MODE: 'gemini',
    GEMINI_API_KEY: 'valid-test-key',
  });
  assert.equal(config.accessControlEnabled, true);
  assert.match(validateConfig(config).join(','), /PREVIEW_ACCESS_TOKEN/);
  assert.match(endpoint, /appConfig\.accessControlEnabled\s*&&\s*!authorizeRequest/);
});

test('frontend não solicita código de acesso durante a análise', () => {
  assert.doesNotMatch(analysis, /window\.prompt/);
  assert.doesNotMatch(analysis, /Digite o código de acesso do piloto fechado/);
  assert.match(analysis, /getStoredAccessToken/);
});

test('header de autorização só é enviado quando já existe token armazenado', () => {
  assert.match(analysis, /if \(accessToken\) headers\.authorization/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../public/auth-v20.js', import.meta.url), 'utf8');

test('cadastro envia o domínio atual como redirect permitido', () => {
  assert.match(source, /function currentRedirect/);
  assert.match(source, /signup\?redirect_to=/);
  assert.match(source, /encodeURIComponent\(redirectTo\)/);
});

test('recuperação retorna para a tela de nova senha', () => {
  assert.match(source, /currentRedirect\('\/\?password-reset=1'\)/);
  assert.match(source, /redirect_to/);
});

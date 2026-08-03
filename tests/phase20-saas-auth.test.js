import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authenticateRequest } from '../src/server/auth.js';
import { loadConfig, validateAuthConfig } from '../src/server/config.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const client = read('public/auth-v20.js');
const ui = read('public/auth-v20-ui.js');
const styles = read('public/auth-v20.css');
const analysis = read('public/analysis.js');
const endpoint = read('api/v1/analyze-screen.js');
const authConfigEndpoint = read('api/v1/auth-config.js');
const serviceWorker = read('public/service-worker.js');
const migration = read('supabase/migrations/20260802210000_create_saas_profiles.sql');

const config = loadConfig({
  APP_RELEASE: 'phase-20-saas-auth',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_12345678901234567890',
  AI_MODE: 'gemini',
  GEMINI_API_KEY: 'gemini-key-for-tests',
});

test('cliente oferece o ciclo completo de autenticação SaaS', () => {
  for (const method of ['signIn', 'signUp', 'requestPasswordReset', 'updatePassword', 'refreshSession', 'signOut']) {
    assert.match(client, new RegExp(`export async function ${method}`));
  }
  assert.match(client, /localStorage\.setItem\(SESSION_KEY/);
  assert.doesNotMatch(client, /service_role/i);
});

test('interface oferece entrar, cadastro, recuperação e saída', () => {
  assert.match(ui, /Entrar no Screen Assistant/);
  assert.match(ui, /Criar sua conta/);
  assert.match(ui, /Recuperar acesso/);
  assert.match(ui, /Definir nova senha/);
  assert.match(ui, /data-auth-signout/);
  assert.match(styles, /@media \(max-width: 760px\)/);
});

test('requisição de análise usa sessão do usuário e não código do piloto', () => {
  assert.match(analysis, /getAccessToken/);
  assert.match(analysis, /Sua sessão expirou/);
  assert.doesNotMatch(analysis, /PREVIEW_ACCESS_TOKEN|ensurePilotAccess|Código de acesso do piloto/);
  assert.doesNotMatch(endpoint, /authorizeRequest|PREVIEW_ACCESS_TOKEN/);
  assert.match(endpoint, /authenticateRequest/);
  assert.match(endpoint, /authentication\.user\.id/);
});

test('configuração exige URL e chave publicável do Supabase', () => {
  assert.deepEqual(validateAuthConfig(config), []);
  assert.equal(config.release, 'phase-20-saas-auth');
  assert.equal(config.supabaseUrl, 'https://example.supabase.co');
  assert.match(authConfigEndpoint, /publishableKey/);
  assert.doesNotMatch(authConfigEndpoint, /service_role/i);
});

test('backend rejeita ausência de sessão', async () => {
  const result = await authenticateRequest(new Request('https://app.test/api'), config, async () => {
    throw new Error('fetch não deveria ser chamado');
  });
  assert.equal(result.error.status, 401);
  assert.equal(result.error.code, 'AUTH_REQUIRED');
});

test('backend aceita usuário confirmado pelo Supabase Auth', async () => {
  const request = new Request('https://app.test/api', {
    headers: { authorization: 'Bearer valid-user-token' },
  });
  const result = await authenticateRequest(request, config, async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/user');
    assert.equal(options.headers.apikey, config.supabasePublishableKey);
    assert.equal(options.headers.authorization, 'Bearer valid-user-token');
    return new Response(JSON.stringify({ id: 'user-1', email: 'user@example.com' }), { status: 200 });
  });
  assert.equal(result.user.id, 'user-1');
  assert.equal(result.user.email, 'user@example.com');
});

test('migração cria perfil com RLS e políticas por usuário', () => {
  assert.match(migration, /create table if not exists public\.profiles/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /on_auth_user_created/);
  assert.doesNotMatch(migration, /password/i);
});

test('PWA publica somente os módulos da autenticação SaaS', () => {
  assert.match(serviceWorker, /screen-assistant-v20-saas-auth/);
  assert.match(serviceWorker, /auth-v20\.js/);
  assert.match(serviceWorker, /auth-v20-ui\.js/);
  assert.match(serviceWorker, /auth-v20\.css/);
  assert.doesNotMatch(serviceWorker, /pilot-access-v19/);
});

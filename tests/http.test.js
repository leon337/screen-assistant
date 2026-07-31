import test from 'node:test';
import assert from 'node:assert/strict';
import { readApiResponse } from '../public/http.js';

test('lê uma resposta JSON válida', async () => {
  const response = new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  assert.deepEqual(await readApiResponse(response), { status: 'success' });
});

test('converte erro textual 503 em mensagem compreensível', async () => {
  const response = new Response('An error occurred with your deployment', { status: 503 });
  await assert.rejects(() => readApiResponse(response), /demorou além do limite/);
});

test('trata corpo vazio sem expor erro de JSON', async () => {
  const response = new Response('', { status: 502 });
  await assert.rejects(() => readApiResponse(response), /não retornou uma resposta/);
});

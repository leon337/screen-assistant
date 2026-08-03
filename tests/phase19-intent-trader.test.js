import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildExpertPrompt,
  getExpertProfile,
  getTaskContract,
  isValidProfileId,
  isValidTaskId,
  normalizeResponseMode,
} from '../src/server/expert-profiles.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const client = read('public/intent-v19.js');
const styles = read('public/intent-v19.css');
const premium = read('public/premium-v18.js');
const analysis = read('public/analysis.js');
const endpoint = read('api/v1/analyze-screen.js');
const validation = read('src/server/validation.js');
const serviceWorker = read('public/service-worker.js');

test('catálogo mantém os cinco perfis especializados', () => {
  for (const id of ['general', 'software-engineer', 'software-architect', 'trader-analyst', 'ux-specialist']) {
    assert.equal(isValidProfileId(id), true);
    assert.equal(getExpertProfile(id).id, id);
  }
});

test('Leonardo Trader possui tarefas oficiais', () => {
  for (const id of [
    'trader-quick-read',
    'trader-map-scenarios',
    'trader-complete-analysis',
    'trader-validate-setup',
    'trader-explain-indicators',
    'trader-build-checklist',
  ]) {
    assert.equal(isValidTaskId(id), true);
    assert.equal(getTaskContract(id).profileId, 'trader-analyst');
  }
});

test('prompt completo contém cenários, entrada, invalidação, risco e ensino', () => {
  const prompt = buildExpertPrompt({
    profileId: 'trader-analyst',
    taskId: 'trader-complete-analysis',
    responseMode: 'detailed',
    question: 'Analise este gráfico em modo de estudo.',
  });
  assert.match(prompt, /Cenário comprador/i);
  assert.match(prompt, /Cenário vendedor/i);
  assert.match(prompt, /Cenário neutro/i);
  assert.match(prompt, /Região de interesse/i);
  assert.match(prompt, /Gatilho necessário/i);
  assert.match(prompt, /Proteção hipotética/i);
  assert.match(prompt, /Relação risco-retorno/i);
  assert.match(prompt, /Condições para não operar/i);
  assert.match(prompt, /Gestão de risco/i);
  assert.match(prompt, /Lição da análise/i);
});

test('prompt do Trader proíbe execução, garantias e alavancagem', () => {
  const prompt = buildExpertPrompt({
    profileId: 'trader-analyst',
    taskId: 'trader-map-scenarios',
    responseMode: 'standard',
    question: 'Mostre os cenários.',
  });
  assert.match(prompt, /Não execute ordens/i);
  assert.match(prompt, /não prometa lucro/i);
  assert.match(prompt, /não garanta direção/i);
  assert.match(prompt, /não incentive alavancagem/i);
});

test('todas as tarefas do Trader preservam risco ou condição de não operar', () => {
  for (const id of [
    'trader-quick-read',
    'trader-map-scenarios',
    'trader-complete-analysis',
    'trader-validate-setup',
    'trader-explain-indicators',
    'trader-build-checklist',
  ]) {
    const instruction = getTaskContract(id).instruction;
    assert.match(instruction, /risco|não operar/i);
  }
});

test('fallbacks usam perfil geral, tarefa explicar e modo padrão', () => {
  assert.equal(getExpertProfile('desconhecido').id, 'general');
  assert.equal(getTaskContract('desconhecida').id, 'explain');
  assert.equal(normalizeResponseMode('extremo'), 'standard');
});

test('cliente seleciona intenção antes do especialista e alinha os dois', () => {
  assert.match(client, /O que você quer descobrir/);
  assert.match(client, /Analisar gráfico/);
  assert.match(client, /Especialista: /);
  assert.match(client, /Leonardo Trader/);
  assert.match(client, /selectIntent/);
  assert.match(client, /selectedProfile === 'trader-analyst'/);
});

test('requisição envia perfil, tarefa e profundidade', () => {
  assert.match(analysis, /form\.append\('profileId'/);
  assert.match(analysis, /form\.append\('taskId'/);
  assert.match(analysis, /form\.append\('responseMode'/);
});

test('servidor valida e usa contexto especializado', () => {
  assert.match(validation, /profileId/);
  assert.match(validation, /taskId/);
  assert.match(validation, /responseMode/);
  assert.match(endpoint, /buildExpertPrompt/);
  assert.match(endpoint, /expertProfile/);
  assert.match(endpoint, /responseMode/);
});

test('mobile oculta compartilhamento, resultado vazio e usa ações contextuais', () => {
  assert.match(styles, /\.screen-details\s*\{\s*display:\s*none/);
  assert.match(styles, /body:not\(\.v19-has-image\) #bar-analyze/);
  assert.match(styles, /body\.v19-has-image #bar-camera/);
  assert.match(styles, /data-premium-route="result"/);
});

test('estado operacional aparece como Mais na jornada mobile', () => {
  assert.match(client, /statusTabLabel\.textContent = 'Mais'/);
  assert.match(premium, /status: \['Mais'/);
});

test('PWA preserva os assets da Fase 19 dentro da Fase 20', () => {
  assert.match(serviceWorker, /screen-assistant-v20-saas-auth/);
  assert.match(serviceWorker, /intent-v19\.js/);
  assert.match(serviceWorker, /intent-v19\.css/);
});

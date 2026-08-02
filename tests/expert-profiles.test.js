import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const serverProfiles = read('src/server/expert-profiles.js');
const validation = read('src/server/validation.js');
const endpoint = read('api/v1/analyze-screen.js');
const clientProfiles = read('public/expert-profiles.js');
const analysis = read('public/analysis.js');
const styles = read('public/expert-profiles.css');

test('catálogo do servidor contém os cinco especialistas do MVP', () => {
  for (const id of ['general', 'software-engineer', 'software-architect', 'trader-analyst', 'ux-specialist']) {
    assert.match(serverProfiles, new RegExp(id));
  }
});

test('perfil trader possui limites contra recomendação financeira', () => {
  assert.match(serverProfiles, /não (?:é|constitui) recomendação financeira|sem recomendação financeira/i);
  assert.match(serverProfiles, /compra|venda/i);
  assert.match(serverProfiles, /garant/i);
});

test('validação lê profileId e aplica fallback seguro', () => {
  assert.match(validation, /formData\.get\(['"]profileId['"]\)/);
  assert.match(validation, /DEFAULT_EXPERT_PROFILE_ID/);
});

test('endpoint monta prompt pelo perfil e devolve metadados do especialista', () => {
  assert.match(endpoint, /expertProfile/);
  assert.match(endpoint, /buildPrompt|prompt/i);
  assert.match(endpoint, /fallbackUsed/);
});

test('frontend oferece seletor com os cinco especialistas', () => {
  assert.match(clientProfiles, /expert-profile/);
  assert.match(clientProfiles, /Assistente geral/);
  assert.match(clientProfiles, /Engenheiro de Software/);
  assert.match(clientProfiles, /Arquiteto de Software/);
  assert.match(clientProfiles, /Trader analítico/);
  assert.match(clientProfiles, /Especialista em UX/);
});

test('requisição envia profileId e identifica o especialista no resultado', () => {
  assert.match(analysis, /form\.append\(['"]profileId['"]/);
  assert.match(analysis, /expertProfile/);
  assert.match(analysis, /expert\.name/);
});

test('reanálise com outro especialista reutiliza a imagem atual', () => {
  assert.match(clientProfiles, /reanalyze-profile/);
  assert.match(clientProfiles, /repeatButton\.click\(\)/);
  assert.doesNotMatch(clientProfiles, /clearImage/);
});

test('seletor mantém acessibilidade e alvos móveis adequados', () => {
  assert.match(clientProfiles, /aria-describedby/);
  assert.match(clientProfiles, /label/);
  assert.match(styles, /min-height:\s*5[02]px/);
  assert.match(styles, /focus-visible/);
});

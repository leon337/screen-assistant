import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const intent = read('public/intent-v22a.js');
const analysis = read('public/analysis.js');
const app = read('public/app.js');
const screen = read('public/first-screen-v22a.js');
const styles = read('public/first-screen-v22a.css');
const desktopStyles = read('public/first-screen-v22a-desktop.css');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('nova análise começa sem intenção, perfil ou tarefa', () => {
  assert.match(intent, /intentId: null/);
  assert.match(intent, /profileId: null/);
  assert.match(intent, /taskId: null/);
  assert.match(intent, /function neutralContext\(/);
});

test('somente profundidade é persistida entre análises', () => {
  assert.match(intent, /PREFERENCE_KEY/);
  assert.match(intent, /JSON\.stringify\(\{ responseMode: context\.responseMode \}\)/);
  assert.doesNotMatch(intent, /JSON\.stringify\(context\)/);
});

test('fluxo principal oferece três intenções e mais opções', () => {
  assert.match(intent, /PRIMARY_INTENT_IDS = Object\.freeze\(\['explain', 'diagnose', 'trader'\]\)/);
  assert.match(intent, /intent-more-toggle/);
  assert.match(intent, /Mais opções/);
  assert.match(intent, /architecture/);
  assert.match(intent, /ux/);
});

test('especialista é sugerido e a troca recalcula uma intenção compatível', () => {
  assert.match(intent, /Especialista sugerido/);
  assert.match(intent, /Trocar/);
  assert.match(intent, /intentByProfile/);
  assert.match(intent, /selectIntent\(intentByProfile/);
  assert.match(intent, /a tarefa será ajustada para manter uma combinação válida/i);
});

test('onboarding do Trader não abre dentro do formulário', () => {
  assert.doesNotMatch(intent, /Conheça o Leonardo Trader/);
  assert.doesNotMatch(intent, /trader-introduction[^\n]*open/);
  assert.match(intent, /Ajustar análise do Leonardo Trader/);
});

test('API bloqueia análise sem contexto completo', () => {
  assert.match(analysis, /intent-v22a\.js/);
  assert.match(analysis, /!analysisContext\.intentId/);
  assert.match(analysis, /!analysisContext\.profileId/);
  assert.match(analysis, /!analysisContext\.taskId/);
  assert.match(analysis, /Escolha o que deseja descobrir antes de analisar/);
});

test('controles exigem imagem e intenção válida', () => {
  assert.match(app, /isAnalysisContextValid/);
  assert.match(app, /!imageBlob \|\| !contextReady/);
  assert.match(app, /analysis-context-change/);
});

test('Nova análise limpa imagem, pergunta e contexto', () => {
  const handler = app.match(/elements\.newAnalysis\.addEventListener[\s\S]*?\n\}\);/)?.[0] || '';
  assert.match(handler, /clearImage\(\)/);
  assert.match(handler, /resetAnalysisContext\(\)/);
  assert.match(handler, /elements\.question\.value = ''/);
  assert.match(handler, /resetResponse\(\)/);
});

test('reiniciar ou trocar imagem retorna explicitamente para a rota de análise', () => {
  assert.match(screen, /function activateAnalyzeRoute\(/);
  assert.match(screen, /dataset\.premiumScreen = 'analyze'/);
  assert.match(screen, /premium-screen-analyze/);
  assert.match(screen, /premium-screen-result/);
  assert.match(screen, /history\.replaceState\(null, '', '#analyze'\)/);
  assert.match(screen, /newAnalysis\.addEventListener\('click', activateAnalyzeRoute, \{ capture: true \}\)/);
  assert.match(screen, /changeImage\.addEventListener\('click', activateAnalyzeRoute, \{ capture: true \}\)/);
});

test('Repetir análise preserva contexto explicitamente', () => {
  assert.match(app, /elements\.repeatAnalysis\.addEventListener\('click', analyzeCurrentImage\)/);
});

test('primeira tela revela conteúdo de forma progressiva', () => {
  assert.match(styles, /not\(\.v22a-has-image\) #intent-v19/);
  assert.match(styles, /not\(\.v22a-has-intent\) \.field-group/);
  assert.match(styles, /v22a-has-intent \.primary-actions/);
  assert.match(screen, /v22a-ready-to-analyze/);
});

test('barras e controles técnicos duplicados são removidos da criação mobile', () => {
  assert.match(styles, /#mobile-action-bar/);
  assert.match(styles, /\.premium-tab-bar/);
  assert.match(styles, /#install-app/);
  assert.match(styles, /#layout-toggle/);
  assert.match(styles, /\.design-v21-journey/);
});

test('desktop preserva compartilhamento e navegação', () => {
  assert.match(desktopStyles, /min-width: 901px/);
  assert.match(desktopStyles, /\.side-column/);
  assert.match(desktopStyles, /display: block !important/);
  assert.match(desktopStyles, /\.premium-tab-bar/);
  assert.match(desktopStyles, /display: flex !important/);
  assert.match(desktopStyles, /grid-template-columns/);
});

test('troca manual é acessível', () => {
  assert.match(intent, /<dialog id="expert-dialog"/);
  assert.match(intent, /aria-live="polite"/);
  assert.match(intent, /aria-label="Voltar"/);
  assert.match(styles, /min-height: 64px/);
});

test('carregador e PWA publicam os assets da fase 22A', () => {
  assert.match(loader, /first-screen-v22a\.css/);
  assert.match(loader, /first-screen-v22a-desktop\.css/);
  assert.match(loader, /first-screen-v22a\.js/);
  assert.match(serviceWorker, /screen-assistant-v22a-progressive-first-screen/);
  assert.match(serviceWorker, /intent-v22a\.js/);
  assert.match(serviceWorker, /first-screen-v22a\.css/);
  assert.match(serviceWorker, /first-screen-v22a-desktop\.css/);
  assert.match(serviceWorker, /first-screen-v22a\.js/);
});

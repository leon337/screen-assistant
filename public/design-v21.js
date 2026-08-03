const hasDom = typeof document !== 'undefined';

const INTENT_ICONS = Object.freeze({
  explain: '◎',
  diagnose: '⌁',
  architecture: '◇',
  ux: '◫',
  trader: '↗',
});

function createJourneyHeader() {
  if (!hasDom || document.getElementById('design-v21-journey')) return;
  const heading = document.querySelector('.premium-screen-heading');
  if (!heading) return;

  const journey = document.createElement('section');
  journey.id = 'design-v21-journey';
  journey.className = 'design-v21-journey';
  journey.setAttribute('aria-label', 'Etapas da análise');
  journey.innerHTML = `
    <div class="design-v21-step" data-v21-step="image">
      <span>1</span><strong>Imagem</strong>
    </div>
    <i aria-hidden="true"></i>
    <div class="design-v21-step" data-v21-step="intent">
      <span>2</span><strong>Objetivo</strong>
    </div>
    <i aria-hidden="true"></i>
    <div class="design-v21-step" data-v21-step="result">
      <span>3</span><strong>Resultado</strong>
    </div>
  `;
  heading.insertAdjacentElement('afterend', journey);
}

function enhanceIntentCards() {
  if (!hasDom) return;
  document.querySelectorAll('[data-intent-id]').forEach((button) => {
    if (button.querySelector('.design-v21-intent-icon')) return;
    const icon = document.createElement('span');
    icon.className = 'design-v21-intent-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = INTENT_ICONS[button.dataset.intentId] || '•';
    button.prepend(icon);
  });
}

function improveCopy() {
  if (!hasDom) return;
  const routeTitle = document.getElementById('premium-route-title');
  const routeSubtitle = document.getElementById('premium-route-subtitle');
  const workspaceTitle = document.getElementById('workspace-title');
  const workspaceText = document.querySelector('.workspace-heading > p');
  const analyzeTab = document.querySelector('[data-premium-route="analyze"] span:last-child');

  if (routeTitle && document.body.dataset.premiumScreen !== 'result') routeTitle.textContent = 'Nova análise';
  if (routeSubtitle && document.body.dataset.premiumScreen !== 'result') routeSubtitle.textContent = 'Envie uma imagem e escolha o que deseja descobrir.';
  if (workspaceTitle) workspaceTitle.textContent = 'Envie uma imagem';
  if (workspaceText) workspaceText.textContent = 'Você poderá escolher o especialista depois.';
  if (analyzeTab) analyzeTab.textContent = 'Início';
}

function addSelectionSummary() {
  if (!hasDom || document.getElementById('design-v21-selection-summary')) return;
  const previewMeta = document.querySelector('.preview-meta');
  if (!previewMeta) return;
  const summary = document.createElement('div');
  summary.id = 'design-v21-selection-summary';
  summary.className = 'design-v21-selection-summary';
  summary.innerHTML = '<span aria-hidden="true">✓</span><div><strong>Imagem pronta</strong><small>Escolha abaixo o objetivo da análise.</small></div>';
  previewMeta.insertAdjacentElement('afterend', summary);
}

function addResultLead() {
  if (!hasDom || document.getElementById('design-v21-result-lead')) return;
  const answer = document.getElementById('answer');
  if (!answer) return;
  const lead = document.createElement('div');
  lead.id = 'design-v21-result-lead';
  lead.className = 'design-v21-result-lead';
  lead.innerHTML = '<span aria-hidden="true">✦</span><div><strong>Análise concluída</strong><small>Leia primeiro a resposta principal e abra os detalhes quando precisar.</small></div>';
  answer.before(lead);
}

function synchronizeState() {
  if (!hasDom) return;
  const hasImage = document.body.classList.contains('v19-has-image');
  const hasAnswer = document.body.classList.contains('v19-has-answer');
  const activeIntent = document.querySelector('[data-intent-id].is-active');

  document.querySelector('[data-v21-step="image"]')?.classList.toggle('is-complete', hasImage);
  document.querySelector('[data-v21-step="intent"]')?.classList.toggle('is-active', hasImage && !hasAnswer);
  document.querySelector('[data-v21-step="result"]')?.classList.toggle('is-active', hasAnswer);
  document.getElementById('design-v21-selection-summary')?.classList.toggle('is-visible', hasImage);
  document.getElementById('design-v21-result-lead')?.classList.toggle('is-visible', hasAnswer);

  const analyze = document.getElementById('analyze');
  const barAnalyze = document.getElementById('bar-analyze');
  const label = activeIntent?.querySelector('strong')?.textContent?.trim();
  if (analyze && label) analyze.innerHTML = `<span aria-hidden="true">✦</span> Analisar: ${label}`;
  if (barAnalyze && label) barAnalyze.innerHTML = `<span aria-hidden="true">✦</span> Analisar`;
}

function observe() {
  if (!hasDom) return;
  new MutationObserver(() => {
    enhanceIntentCards();
    improveCopy();
    synchronizeState();
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'aria-busy', 'data-premium-screen'],
  });
}

if (hasDom) {
  document.body.classList.add('design-v21');
  createJourneyHeader();
  addSelectionSummary();
  addResultLead();
  enhanceIntentCards();
  improveCopy();
  synchronizeState();
  observe();
}

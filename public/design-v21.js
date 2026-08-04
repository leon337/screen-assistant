const hasDom = typeof document !== 'undefined';

const INTENT_ICONS = Object.freeze({
  explain: '◎',
  diagnose: '⌁',
  architecture: '◇',
  ux: '◫',
  trader: '↗',
});

let initialized = false;
let synchronizationScheduled = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setHtml(element, value) {
  if (element && element.innerHTML !== value) element.innerHTML = value;
}

function setClass(element, className, enabled) {
  if (!element) return;
  const active = element.classList.contains(className);
  if (active !== enabled) element.classList.toggle(className, enabled);
}

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
  if (!hasDom || document.body.classList.contains('first-screen-v22a')) return;
  const routeTitle = document.getElementById('premium-route-title');
  const routeSubtitle = document.getElementById('premium-route-subtitle');
  const workspaceTitle = document.getElementById('workspace-title');
  const workspaceText = document.querySelector('.workspace-heading > p');
  const analyzeTab = document.querySelector('[data-premium-route="analyze"] span:last-child');

  if (document.body.dataset.premiumScreen !== 'result') {
    setText(routeTitle, 'Nova análise');
    setText(routeSubtitle, 'Envie uma imagem e escolha o que deseja descobrir.');
  }
  setText(workspaceTitle, 'Envie uma imagem');
  setText(workspaceText, 'Você poderá escolher o especialista depois.');
  setText(analyzeTab, 'Início');
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
  if (!hasDom || document.body.dataset.authState !== 'authenticated') return;
  const hasImage = document.body.classList.contains('v19-has-image');
  const hasAnswer = document.body.classList.contains('v19-has-answer');
  const activeIntent = document.querySelector('[data-intent-id].is-active');

  setClass(document.querySelector('[data-v21-step="image"]'), 'is-complete', hasImage);
  setClass(document.querySelector('[data-v21-step="intent"]'), 'is-active', hasImage && !hasAnswer);
  setClass(document.querySelector('[data-v21-step="result"]'), 'is-active', hasAnswer);
  setClass(document.getElementById('design-v21-selection-summary'), 'is-visible', hasImage);
  setClass(document.getElementById('design-v21-result-lead'), 'is-visible', hasAnswer);

  const analyze = document.getElementById('analyze');
  const barAnalyze = document.getElementById('bar-analyze');
  const label = activeIntent?.querySelector('strong')?.textContent?.trim();
  if (label) {
    if (document.body.classList.contains('first-screen-v22a')) setHtml(analyze, 'Analisar agora');
    else setHtml(analyze, `<span aria-hidden="true">✦</span> Analisar: ${label}`);
    setHtml(barAnalyze, '<span aria-hidden="true">✦</span> Analisar');
  }
}

function synchronizeDesign() {
  enhanceIntentCards();
  improveCopy();
  synchronizeState();
}

function scheduleSynchronization() {
  if (synchronizationScheduled) return;
  synchronizationScheduled = true;
  const run = () => {
    synchronizationScheduled = false;
    synchronizeDesign();
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else queueMicrotask(run);
}

function observeApplication() {
  new MutationObserver(scheduleSynchronization).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'aria-busy', 'data-premium-screen'],
  });
}

function initializeDesign() {
  if (!hasDom || initialized || document.body.dataset.authState !== 'authenticated') return;
  initialized = true;
  createJourneyHeader();
  addSelectionSummary();
  addResultLead();
  synchronizeDesign();
  observeApplication();
}

function waitForAuthentication() {
  if (!hasDom) return;
  document.body.classList.add('design-v21');

  if (document.body.dataset.authState === 'authenticated') {
    initializeDesign();
    return;
  }

  const authObserver = new MutationObserver(() => {
    if (document.body.dataset.authState !== 'authenticated') return;
    authObserver.disconnect();
    initializeDesign();
  });
  authObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-auth-state'],
  });
}

waitForAuthentication();

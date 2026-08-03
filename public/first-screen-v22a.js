const hasDom = typeof document !== 'undefined';
let initialized = false;
let scheduled = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function activateAnalyzeRoute() {
  if (!hasDom) return;

  document.body.dataset.premiumScreen = 'analyze';

  const screens = {
    analyze: document.getElementById('premium-screen-analyze'),
    result: document.getElementById('premium-screen-result'),
    status: document.getElementById('premium-screen-status'),
  };

  for (const [name, screen] of Object.entries(screens)) {
    const active = name === 'analyze';
    screen?.classList.toggle('is-active', active);
    screen?.setAttribute('aria-hidden', String(!active));
  }

  document.querySelectorAll('[data-premium-route]').forEach((tab) => {
    const active = tab.dataset.premiumRoute === 'analyze';
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
  });

  history.replaceState(null, '', '#analyze');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindRestartActions() {
  const newAnalysis = document.getElementById('new-analysis');
  const changeImage = document.getElementById('change-image');

  if (newAnalysis && newAnalysis.dataset.v22aRouteBound !== 'true') {
    newAnalysis.dataset.v22aRouteBound = 'true';
    newAnalysis.addEventListener('click', activateAnalyzeRoute, { capture: true });
  }

  if (changeImage && changeImage.dataset.v22aRouteBound !== 'true') {
    changeImage.dataset.v22aRouteBound = 'true';
    changeImage.addEventListener('click', activateAnalyzeRoute, { capture: true });
  }
}

function addChangeImageAction() {
  if (!hasDom || document.getElementById('v22a-change-image')) return;
  const previewMeta = document.querySelector('.preview-meta');
  if (!previewMeta) return;
  const button = document.createElement('button');
  button.id = 'v22a-change-image';
  button.className = 'v22a-change-image';
  button.type = 'button';
  button.textContent = 'Trocar imagem';
  button.addEventListener('click', () => document.getElementById('open-gallery')?.click());
  previewMeta.insertAdjacentElement('afterend', button);
}

function simplifyCopy() {
  const hasImage = document.body.classList.contains('v22a-has-image');
  const hasIntent = document.body.classList.contains('v22a-has-intent');
  const routeTitle = document.getElementById('premium-route-title');
  const routeSubtitle = document.getElementById('premium-route-subtitle');

  setText(routeTitle, hasImage ? 'Defina o objetivo' : 'O que você quer analisar?');
  setText(routeSubtitle, hasImage
    ? 'Escolha o que deseja descobrir. O especialista será sugerido automaticamente.'
    : 'Envie uma foto, imagem ou captura de tela.');
  document.body.classList.toggle('v22a-ready-to-analyze', hasImage && hasIntent);
}

function synchronize() {
  bindRestartActions();
  addChangeImageAction();
  simplifyCopy();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  const run = () => {
    scheduled = false;
    synchronize();
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else queueMicrotask(run);
}

function initialize() {
  if (!hasDom || initialized || document.body.dataset.authState !== 'authenticated') return;
  initialized = true;
  document.body.classList.add('first-screen-v22a');
  synchronize();
  new MutationObserver(schedule).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'data-premium-screen'],
  });
  document.addEventListener('analysis-context-change', schedule);
}

function waitForAuth() {
  if (!hasDom) return;
  if (document.body.dataset.authState === 'authenticated') return initialize();
  const observer = new MutationObserver(() => {
    if (document.body.dataset.authState !== 'authenticated') return;
    observer.disconnect();
    initialize();
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-auth-state'] });
}

waitForAuth();

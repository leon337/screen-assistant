const mobileApp = window.matchMedia('(max-width: 900px), (pointer: coarse)');

const screenMap = {
  analyze: document.getElementById('premium-screen-analyze'),
  result: document.getElementById('premium-screen-result'),
  status: document.getElementById('premium-screen-status'),
};

const tabs = [...document.querySelectorAll('[data-premium-route]')];
const answer = document.getElementById('answer');
const analyzeButton = document.getElementById('analyze');
const barAnalyze = document.getElementById('bar-analyze');
const newAnalysis = document.getElementById('new-analysis');
const statusMount = document.getElementById('premium-status-mount');
const privacyBanner = document.querySelector('.privacy-banner');
const premiumTopActions = document.querySelector('.premium-top-actions');
const desktopHeaderActions = document.querySelector('.header-actions');
const layoutToggle = document.getElementById('layout-toggle');
const installApp = document.getElementById('install-app');
const title = document.getElementById('premium-route-title');
const subtitle = document.getElementById('premium-route-subtitle');

const routeCopy = {
  analyze: ['Nova análise', 'Escolha uma imagem e faça sua pergunta.'],
  result: ['Resultado', 'Leia, copie, ouça ou compartilhe a resposta.'],
  status: ['Estado do app', 'Confira a publicação e a configuração atual.'],
};

function activateScreen(route, { updateHash = true } = {}) {
  if (!mobileApp.matches) {
    for (const screen of Object.values(screenMap)) screen?.setAttribute('aria-hidden', 'false');
    return;
  }

  const next = screenMap[route] ? route : 'analyze';
  document.body.dataset.premiumScreen = next;
  for (const [name, screen] of Object.entries(screenMap)) {
    screen?.classList.toggle('is-active', name === next);
    screen?.setAttribute('aria-hidden', String(name !== next));
  }
  for (const tab of tabs) {
    const active = tab.dataset.premiumRoute === next;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
  }
  const [heading, description] = routeCopy[next];
  if (title) title.textContent = heading;
  if (subtitle) subtitle.textContent = description;
  if (updateHash) history.replaceState(null, '', `#${next}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

for (const tab of tabs) {
  tab.addEventListener('click', () => activateScreen(tab.dataset.premiumRoute));
}

function syncOperationalStatus() {
  const card = document.getElementById('operational-status');
  if (!card) return;
  if (mobileApp.matches && statusMount && card.parentElement !== statusMount) {
    statusMount.append(card);
  } else if (!mobileApp.matches && privacyBanner && card.previousElementSibling !== privacyBanner) {
    privacyBanner.insertAdjacentElement('afterend', card);
  }
}

function syncHeaderActions() {
  const target = mobileApp.matches ? premiumTopActions : desktopHeaderActions;
  if (!target) return;
  if (layoutToggle && layoutToggle.parentElement !== target) target.append(layoutToggle);
  if (installApp && installApp.parentElement !== target) target.append(installApp);
}

new MutationObserver(syncOperationalStatus).observe(document.body, { childList: true, subtree: true });
syncOperationalStatus();

function openResult() {
  if (mobileApp.matches) activateScreen('result');
}

analyzeButton?.addEventListener('click', openResult);
barAnalyze?.addEventListener('click', openResult);
newAnalysis?.addEventListener('click', () => activateScreen('analyze'));

if (answer) {
  new MutationObserver(() => {
    if (!mobileApp.matches) return;
    const text = answer.textContent?.trim() || '';
    if (answer.getAttribute('aria-busy') === 'true' || (text && !['Aguardando análise.', 'A resposta aparecerá aqui depois da análise.'].includes(text))) {
      const userIsOnStatus = document.body.dataset.premiumScreen === 'status';
      if (!userIsOnStatus) activateScreen('result');
    }
  }).observe(answer, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-busy'] });
}

function updateKeyboardState() {
  if (!window.visualViewport || !mobileApp.matches) return;
  const keyboardOpen = window.innerHeight - window.visualViewport.height > 140;
  document.body.classList.toggle('premium-keyboard-open', keyboardOpen);
}

function syncResponsiveMode() {
  document.body.classList.remove('premium-keyboard-open');
  syncHeaderActions();
  syncOperationalStatus();
  activateScreen(location.hash.slice(1) || 'analyze', { updateHash: false });
}

window.visualViewport?.addEventListener('resize', updateKeyboardState);
window.visualViewport?.addEventListener('scroll', updateKeyboardState);
window.addEventListener('hashchange', () => activateScreen(location.hash.slice(1), { updateHash: false }));
mobileApp.addEventListener('change', syncResponsiveMode);
syncResponsiveMode();

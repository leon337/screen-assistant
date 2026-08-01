const stylesheetId = 'screen-assistant-mobile-v18-style';
if (!document.getElementById(stylesheetId)) {
  const link = document.createElement('link');
  link.id = stylesheetId;
  link.rel = 'stylesheet';
  link.href = '/mobile-v18.css';
  document.head.append(link);
}

const compactMedia = window.matchMedia('(max-width: 860px), (pointer: coarse)');
const answer = document.getElementById('answer');
const responsePanel = document.getElementById('response-panel');
const screenPanel = document.getElementById('screen-panel');
const emptyMessages = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
  'Iniciando análise…',
]);

let responseVisible = false;

document.body.dataset.mobileDesign = 'phase-18';

function hasReadableResult() {
  if (!answer || answer.getAttribute('aria-busy') === 'true') return false;
  const text = answer.textContent?.trim() || '';
  return Boolean(text) && !emptyMessages.has(text);
}

function updateMobileContext() {
  const compact = compactMedia.matches;
  document.body.classList.toggle('mobile-reading-result', compact && responseVisible && hasReadableResult());
  if (compact && screenPanel?.open) screenPanel.open = false;
}

if (responsePanel && 'IntersectionObserver' in window) {
  new IntersectionObserver((entries) => {
    responseVisible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= .18);
    updateMobileContext();
  }, { threshold: [0, .18, .5] }).observe(responsePanel);
}

if (answer) {
  new MutationObserver(updateMobileContext).observe(answer, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-busy', 'class'],
  });
}

function updateKeyboardState() {
  const viewport = window.visualViewport;
  const keyboardOpen = Boolean(
    compactMedia.matches && viewport && viewport.height < window.innerHeight * .72,
  );
  document.body.classList.toggle('mobile-keyboard-open', keyboardOpen);
}

compactMedia.addEventListener?.('change', updateMobileContext);
window.visualViewport?.addEventListener('resize', updateKeyboardState);
window.addEventListener('orientationchange', () => {
  updateKeyboardState();
  updateMobileContext();
});

updateKeyboardState();
updateMobileContext();

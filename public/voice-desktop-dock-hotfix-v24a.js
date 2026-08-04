const DESKTOP_QUERY = '(min-width: 901px) and (pointer: fine)';
const EMPTY_ANSWERS = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
  'Iniciando análise…',
]);

let dockObserver = null;
let answerObserver = null;
let bodyObserver = null;
let retryTimer = null;

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function answerReady() {
  const answer = document.getElementById('answer');
  const text = answer?.textContent?.trim() || '';
  const busy = answer?.getAttribute('aria-busy') === 'true';
  return Boolean(text && !busy && !EMPTY_ANSWERS.has(text));
}

function synchronizeDesktopDock() {
  const dock = document.getElementById('voice-dock-v24a');
  if (!dock) return false;

  const visible = isDesktop() && answerReady();
  if (visible && dock.hidden) dock.hidden = false;
  if (!visible && isDesktop() && !dock.hidden) dock.hidden = true;

  document.body.dataset.voiceDesktopDock = visible ? 'visible' : 'hidden';
  return true;
}

function connectObservers() {
  const dock = document.getElementById('voice-dock-v24a');
  const answer = document.getElementById('answer');
  if (!dock || !answer) return false;

  dockObserver = new MutationObserver(() => {
    if (isDesktop() && answerReady() && dock.hidden) dock.hidden = false;
  });
  dockObserver.observe(dock, { attributes: true, attributeFilter: ['hidden'] });

  answerObserver = new MutationObserver(synchronizeDesktopDock);
  answerObserver.observe(answer, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-busy'],
  });

  bodyObserver = new MutationObserver(synchronizeDesktopDock);
  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-premium-screen', 'data-auth-state'],
  });

  window.matchMedia(DESKTOP_QUERY).addEventListener('change', synchronizeDesktopDock);
  synchronizeDesktopDock();
  return true;
}

function initialize() {
  if (connectObservers()) return;

  let attempts = 0;
  retryTimer = window.setInterval(() => {
    attempts += 1;
    if (connectObservers() || attempts >= 40) {
      window.clearInterval(retryTimer);
      retryTimer = null;
      if (attempts >= 40 && !document.getElementById('voice-dock-v24a')) {
        document.body.dataset.voiceDesktopDock = 'missing';
        console.error('voice_desktop_dock_missing');
      }
    }
  }, 125);
}

initialize();

window.addEventListener('beforeunload', () => {
  if (retryTimer) window.clearInterval(retryTimer);
  dockObserver?.disconnect();
  answerObserver?.disconnect();
  bodyObserver?.disconnect();
});

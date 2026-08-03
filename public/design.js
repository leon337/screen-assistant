import './status.js';
import './premium-v18.js';
import { initializeAuthGate } from './auth-v20-ui.js';

document.body.dataset.authState = 'loading';

for (const href of ['/auth-v20.css', '/auth-v21.css', '/design-v21.css', '/result-v22.css', '/first-screen-v22a.css', '/first-screen-v22a-desktop.css', '/voice-v23.css']) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

await initializeAuthGate();
await import('./design-v21.js');
await import('./result-v22.js');
await import('./first-screen-v22a.js');
await import('./voice-v23.js');

const answer = document.getElementById('answer');

const emptyMessages = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
]);

function synchronizeAnswerState() {
  if (!answer) return;
  const text = answer.textContent?.trim() || '';
  const busy = answer.getAttribute('aria-busy') === 'true';
  answer.classList.toggle('answer-empty', !busy && emptyMessages.has(text));
}

if (answer) {
  new MutationObserver(synchronizeAnswerState).observe(answer, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-busy'],
  });
  synchronizeAnswerState();
}

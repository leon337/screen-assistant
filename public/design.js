import './status.js';
import './premium-v18.js';
import { initializeAuthGate } from './auth-v20-ui.js';

document.body.dataset.authState = 'loading';

const authStyles = document.createElement('link');
authStyles.rel = 'stylesheet';
authStyles.href = '/auth-v20.css';
document.head.append(authStyles);

await initializeAuthGate();

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

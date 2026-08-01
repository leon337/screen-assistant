import './status.js';

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

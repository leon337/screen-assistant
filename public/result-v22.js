const hasDom = typeof document !== 'undefined';

let scheduled = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setHidden(element, hidden) {
  if (element && element.hidden !== hidden) element.hidden = hidden;
}

function ensureTechnicalDetails() {
  const meta = document.getElementById('response-meta');
  const moreActions = document.querySelector('.more-actions');
  if (!meta || !moreActions) return null;

  let details = document.getElementById('technical-details-v22');
  if (!details) {
    details = document.createElement('details');
    details.id = 'technical-details-v22';
    details.className = 'technical-details-v22';
    const summary = document.createElement('summary');
    summary.textContent = 'Detalhes técnicos';
    details.append(summary, meta);
    moreActions.append(details);
  }
  return details;
}

function synchronizeResultExperience() {
  if (!hasDom || document.body.dataset.authState !== 'authenticated') return;

  const answer = document.getElementById('answer');
  const busy = answer?.getAttribute('aria-busy') === 'true';
  const title = document.querySelector('.response-title h2');
  const resultLead = document.getElementById('design-v21-result-lead');
  const details = ensureTechnicalDetails();
  const meta = document.getElementById('response-meta');

  document.body.classList.add('result-v22');
  document.body.toggleAttribute('data-v22-busy', Boolean(busy));

  setText(title, busy ? 'Analisando imagem' : 'Resultado da análise');
  setText(document.getElementById('new-analysis'), 'Analisar outra imagem');
  setText(document.getElementById('change-image'), 'Usar outra imagem');
  setText(document.getElementById('repeat-analysis'), 'Analisar novamente');
  setText(document.getElementById('clear-all'), 'Apagar análise');

  setHidden(resultLead, true);
  setHidden(details, !meta?.textContent?.trim());
}

function scheduleSynchronization() {
  if (scheduled) return;
  scheduled = true;
  const run = () => {
    scheduled = false;
    synchronizeResultExperience();
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  else queueMicrotask(run);
}

function initialize() {
  if (!hasDom) return;
  document.body.classList.add('result-v22');
  synchronizeResultExperience();
  new MutationObserver(scheduleSynchronization).observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'aria-busy', 'data-premium-screen', 'data-auth-state'],
  });
}

initialize();

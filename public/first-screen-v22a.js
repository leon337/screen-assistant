const hasDom = typeof document !== 'undefined';
let initialized = false;
let scheduled = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
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

const PREFERENCE_KEY = 'screen-assistant-v22a-preferences';
const hasBrowserDom = typeof document !== 'undefined';

const INTENTS = Object.freeze([
  { id: 'explain', label: 'Explicar o conteúdo', hint: 'Entender o que aparece na imagem', profileId: 'general', taskId: 'explain' },
  { id: 'diagnose', label: 'Encontrar um problema', hint: 'Identificar erro, código ou configuração', profileId: 'software-engineer', taskId: 'diagnose' },
  { id: 'trader', label: 'Analisar um gráfico', hint: 'Mapear cenários e riscos com Leonardo Trader', profileId: 'trader-analyst', taskId: 'trader-map-scenarios' },
  { id: 'ux', label: 'Avaliar uma interface', hint: 'Revisar usabilidade, hierarquia e acessibilidade', profileId: 'ux-specialist', taskId: 'ux' },
  { id: 'architecture', label: 'Avaliar arquitetura', hint: 'Examinar componentes, integrações e riscos', profileId: 'software-architect', taskId: 'architecture' },
]);

const PRIMARY_INTENT_IDS = Object.freeze(['explain', 'diagnose', 'trader']);
const TRADER_TASKS = Object.freeze([
  { id: 'trader-quick-read', label: 'Leitura rápida' },
  { id: 'trader-map-scenarios', label: 'Mapear cenários' },
  { id: 'trader-complete-analysis', label: 'Análise completa' },
  { id: 'trader-validate-setup', label: 'Validar meu setup' },
  { id: 'trader-explain-indicators', label: 'Explicar indicadores' },
  { id: 'trader-build-checklist', label: 'Criar checklist' },
]);

const PROFILE_NAMES = Object.freeze({
  general: 'Assistente geral',
  'software-engineer': 'Diagnóstico técnico',
  'software-architect': 'Arquitetura',
  'ux-specialist': 'UX e Design',
  'trader-analyst': 'Leonardo Trader',
});

let context = neutralContext();
let hadImage = false;

function neutralContext() {
  return {
    intentId: null,
    profileId: null,
    taskId: null,
    responseMode: readResponseMode(),
  };
}

function readResponseMode() {
  if (!hasBrowserDom || typeof localStorage === 'undefined') return 'standard';
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCE_KEY) || '{}').responseMode;
    return ['concise', 'standard', 'detailed'].includes(value) ? value : 'standard';
  } catch {
    return 'standard';
  }
}

function persistResponseMode() {
  if (!hasBrowserDom || typeof localStorage === 'undefined') return;
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ responseMode: context.responseMode }));
}

function installBaseStylesheet() {
  if (!hasBrowserDom || document.querySelector('link[data-intent-v19]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/intent-v19.css';
  link.dataset.intentV19 = 'true';
  document.head.append(link);
}

function intentButton(item) {
  return `
    <button type="button" class="intent-card" data-intent-id="${item.id}" role="radio" aria-checked="false">
      <strong>${item.label}</strong>
      <small>${item.hint}</small>
    </button>
  `;
}

function buildPicker() {
  if (!hasBrowserDom) return;
  const questionGroup = document.getElementById('question')?.closest('.field-group');
  if (!questionGroup || document.getElementById('intent-v19')) return;

  const primary = INTENTS.filter((item) => PRIMARY_INTENT_IDS.includes(item.id));
  const secondary = INTENTS.filter((item) => !PRIMARY_INTENT_IDS.includes(item.id));
  const section = document.createElement('section');
  section.id = 'intent-v19';
  section.className = 'intent-v19 intent-v22a';
  section.setAttribute('aria-labelledby', 'intent-v22a-title');
  section.innerHTML = `
    <div class="intent-heading">
      <div>
        <p class="section-kicker">Objetivo</p>
        <h2 id="intent-v22a-title" tabindex="-1">O que você quer descobrir?</h2>
      </div>
    </div>

    <div class="intent-grid intent-primary-list" role="radiogroup" aria-label="Objetivo da análise">
      ${primary.map(intentButton).join('')}
    </div>

    <button id="intent-more-toggle" class="intent-more-toggle" type="button" aria-expanded="false" aria-controls="intent-more-options">
      Mais opções
    </button>
    <div id="intent-more-options" class="intent-grid intent-more-options hidden">
      ${secondary.map(intentButton).join('')}
    </div>

    <div id="expert-suggestion" class="expert-suggestion hidden" aria-live="polite">
      <div>
        <small>Especialista sugerido</small>
        <strong id="suggested-expert">Selecione um objetivo</strong>
      </div>
      <button id="change-expert" class="expert-change" type="button">Trocar</button>
    </div>

    <div id="trader-options" class="trader-options hidden">
      <details class="trader-task-details">
        <summary>Ajustar análise do Leonardo Trader</summary>
        <label for="trader-task">Tipo de análise</label>
        <select id="trader-task">
          ${TRADER_TASKS.map((task) => `<option value="${task.id}">${task.label}</option>`).join('')}
        </select>
      </details>
    </div>

    <details class="analysis-preferences">
      <summary>Profundidade da resposta</summary>
      <label>Profundidade
        <select id="response-mode">
          <option value="concise">Rápida</option>
          <option value="standard">Padrão</option>
          <option value="detailed">Detalhada</option>
        </select>
      </label>
    </details>

    <dialog id="expert-dialog" class="expert-dialog" aria-labelledby="expert-dialog-title">
      <form method="dialog" class="expert-dialog-card">
        <div class="expert-dialog-heading">
          <button id="expert-dialog-back" class="expert-back" type="button" aria-label="Voltar">←</button>
          <div><small>Opcional</small><h2 id="expert-dialog-title">Trocar especialista</h2></div>
        </div>
        <p>Ao trocar o especialista, a tarefa será ajustada para manter uma combinação válida.</p>
        <div class="expert-list" role="radiogroup" aria-label="Especialistas disponíveis">
          ${Object.entries(PROFILE_NAMES).map(([id, name]) => {
            const intent = INTENTS.find((item) => item.profileId === id);
            return `<button type="button" class="expert-option" data-profile-id="${id}" role="radio" aria-checked="false"><strong>${name}</strong><small>${intent?.hint || ''}</small></button>`;
          }).join('')}
        </div>
      </form>
    </dialog>
  `;

  questionGroup.before(section);
  bindPicker(section);
  renderContext(section);
}

function intentById(id) {
  return INTENTS.find((item) => item.id === id) || null;
}

function intentByProfile(profileId) {
  return INTENTS.find((item) => item.profileId === profileId) || null;
}

function selectIntent(intent) {
  if (!intent) return;
  context.intentId = intent.id;
  context.profileId = intent.profileId;
  context.taskId = intent.id === 'trader' && TRADER_TASKS.some((task) => task.id === context.taskId)
    ? context.taskId : intent.taskId;
  renderContext();
  updateQuestionPlaceholder();
  notifyContextChange();
}

function openExpertDialog(section) {
  const dialog = section.querySelector('#expert-dialog');
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  const current = dialog.querySelector(`[data-profile-id="${context.profileId}"]`) || dialog.querySelector('[data-profile-id]');
  current?.focus();
}

function closeExpertDialog(section) {
  const dialog = section.querySelector('#expert-dialog');
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
  section.querySelector('#change-expert')?.focus();
}

function bindPicker(section) {
  section.querySelectorAll('[data-intent-id]').forEach((button) => {
    button.addEventListener('click', () => selectIntent(intentById(button.dataset.intentId)));
  });

  section.querySelector('#intent-more-toggle')?.addEventListener('click', (event) => {
    const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
    event.currentTarget.setAttribute('aria-expanded', String(!expanded));
    section.querySelector('#intent-more-options')?.classList.toggle('hidden', expanded);
  });

  section.querySelector('#change-expert')?.addEventListener('click', () => openExpertDialog(section));
  section.querySelector('#expert-dialog-back')?.addEventListener('click', () => closeExpertDialog(section));

  section.querySelectorAll('[data-profile-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectIntent(intentByProfile(button.dataset.profileId));
      closeExpertDialog(section);
    });
  });

  section.querySelector('#trader-task')?.addEventListener('change', (event) => {
    const trader = intentById('trader');
    context.intentId = trader.id;
    context.profileId = trader.profileId;
    context.taskId = TRADER_TASKS.some((task) => task.id === event.target.value)
      ? event.target.value : trader.taskId;
    renderContext(section);
    notifyContextChange();
  });

  section.querySelector('#response-mode')?.addEventListener('change', (event) => {
    context.responseMode = ['concise', 'standard', 'detailed'].includes(event.target.value)
      ? event.target.value : 'standard';
    persistResponseMode();
    notifyContextChange();
  });
}

function renderContext(section = hasBrowserDom ? document.getElementById('intent-v19') : null) {
  if (!section) return;
  section.querySelectorAll('[data-intent-id]').forEach((button) => {
    const active = button.dataset.intentId === context.intentId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  });
  section.querySelectorAll('[data-profile-id]').forEach((button) => {
    const active = button.dataset.profileId === context.profileId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  });

  const selectedIntent = intentById(context.intentId);
  const secondarySelected = selectedIntent && !PRIMARY_INTENT_IDS.includes(selectedIntent.id);
  if (secondarySelected) {
    section.querySelector('#intent-more-toggle')?.setAttribute('aria-expanded', 'true');
    section.querySelector('#intent-more-options')?.classList.remove('hidden');
  }

  const valid = isAnalysisContextValid();
  section.querySelector('#expert-suggestion')?.classList.toggle('hidden', !valid);
  const expert = section.querySelector('#suggested-expert');
  if (expert) expert.textContent = valid ? PROFILE_NAMES[context.profileId] : 'Selecione um objetivo';
  section.querySelector('#trader-options')?.classList.toggle('hidden', context.intentId !== 'trader');

  const traderTask = section.querySelector('#trader-task');
  if (traderTask && TRADER_TASKS.some((task) => task.id === context.taskId)) traderTask.value = context.taskId;
  const responseMode = section.querySelector('#response-mode');
  if (responseMode) responseMode.value = context.responseMode;

  document.body.classList.toggle('v22a-has-intent', valid);
}

function updateQuestionPlaceholder() {
  if (!hasBrowserDom) return;
  const question = document.getElementById('question');
  if (!question) return;
  const placeholders = {
    explain: 'Ex.: Explique o conteúdo principal desta imagem.',
    diagnose: 'Ex.: Qual é o problema principal e como posso verificá-lo?',
    architecture: 'Ex.: Avalie os componentes e os riscos desta arquitetura.',
    ux: 'Ex.: O que está confundindo o usuário nesta interface?',
    trader: 'Ex.: Mapeie os cenários de alta, baixa e neutralidade.',
  };
  question.placeholder = context.intentId ? placeholders[context.intentId] : 'Opcional: acrescente contexto para a análise.';
}

function notifyContextChange() {
  if (!hasBrowserDom) return;
  document.dispatchEvent(new CustomEvent('analysis-context-change', { detail: getAnalysisContext() }));
}

function synchronizeJourney() {
  if (!hasBrowserDom) return;
  const preview = document.getElementById('image-preview');
  const answer = document.getElementById('answer');
  const hasImage = Boolean(preview?.getAttribute('src')) && !preview.classList.contains('hidden');
  const answerText = answer?.textContent?.trim() || '';
  const busy = answer?.getAttribute('aria-busy') === 'true';
  const emptyMessages = new Set(['Aguardando análise.', 'A resposta aparecerá aqui depois da análise.', 'Iniciando análise…']);
  const hasAnswer = busy || (Boolean(answerText) && !emptyMessages.has(answerText));

  document.body.classList.toggle('v19-has-image', hasImage);
  document.body.classList.toggle('v19-has-answer', hasAnswer);
  document.body.classList.toggle('v22a-has-image', hasImage);
  document.body.classList.toggle('v22a-has-answer', hasAnswer);

  if (hasImage && !hadImage) {
    setTimeout(() => document.getElementById('intent-v22a-title')?.focus({ preventScroll: false }), 0);
  }
  hadImage = hasImage;
}

export function getAnalysisContext() {
  return { ...context };
}

export function isAnalysisContextValid() {
  return Boolean(context.intentId && context.profileId && context.taskId);
}

export function resetAnalysisContext() {
  context = neutralContext();
  renderContext();
  updateQuestionPlaceholder();
  notifyContextChange();
}

if (hasBrowserDom) {
  installBaseStylesheet();
  buildPicker();
  updateQuestionPlaceholder();
  new MutationObserver(synchronizeJourney).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'class', 'aria-busy'],
  });
  synchronizeJourney();
}

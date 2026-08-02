const STORAGE_KEY = 'screen-assistant-v19-context';

const INTENTS = Object.freeze([
  { id: 'explain', label: 'Explicar a imagem', hint: 'Entender o conteúdo principal', profileId: 'general', taskId: 'explain' },
  { id: 'diagnose', label: 'Encontrar um problema', hint: 'Diagnosticar erro, código ou configuração', profileId: 'software-engineer', taskId: 'diagnose' },
  { id: 'architecture', label: 'Avaliar arquitetura', hint: 'Componentes, integrações e riscos', profileId: 'software-architect', taskId: 'architecture' },
  { id: 'ux', label: 'Avaliar interface', hint: 'Usabilidade, hierarquia e acessibilidade', profileId: 'ux-specialist', taskId: 'ux' },
  { id: 'trader', label: 'Analisar gráfico', hint: 'Cenários e gestão de risco com Leonardo Trader', profileId: 'trader-analyst', taskId: 'trader-map-scenarios' },
]);

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
  'software-engineer': 'Engenheiro de Software',
  'software-architect': 'Arquiteto de Software',
  'ux-specialist': 'Especialista em UX',
  'trader-analyst': 'Leonardo Trader',
});

let context = {
  intentId: 'explain',
  profileId: 'general',
  taskId: 'explain',
  responseMode: 'standard',
};

function readStoredContext() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const intent = INTENTS.find((item) => item.id === stored.intentId) || INTENTS[0];
    context = {
      intentId: intent.id,
      profileId: intent.profileId,
      taskId: intent.id === 'trader' && TRADER_TASKS.some((task) => task.id === stored.taskId)
        ? stored.taskId : intent.taskId,
      responseMode: ['concise', 'standard', 'detailed'].includes(stored.responseMode)
        ? stored.responseMode : 'standard',
    };
  } catch {
    context = { intentId: 'explain', profileId: 'general', taskId: 'explain', responseMode: 'standard' };
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

function installStylesheet() {
  if (document.querySelector('link[data-intent-v19]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/intent-v19.css';
  link.dataset.intentV19 = 'true';
  document.head.append(link);
}

function traderIntroduction() {
  return `
    <section id="trader-introduction" class="trader-introduction" aria-live="polite">
      <strong>Leonardo Trader</strong>
      <p>Mentor educacional de análise gráfica e gestão de risco. Ele organiza cenários, confirmações e invalidações, sem mandar comprar ou vender.</p>
    </section>
  `;
}

function buildPicker() {
  const questionGroup = document.getElementById('question')?.closest('.field-group');
  if (!questionGroup || document.getElementById('intent-v19')) return;

  const section = document.createElement('section');
  section.id = 'intent-v19';
  section.className = 'intent-v19';
  section.setAttribute('aria-labelledby', 'intent-v19-title');
  section.innerHTML = `
    <div class="intent-heading">
      <div>
        <p class="section-kicker">Objetivo</p>
        <h2 id="intent-v19-title">O que você quer descobrir?</h2>
      </div>
      <span id="suggested-expert" class="suggested-expert"></span>
    </div>
    <div class="intent-grid" role="radiogroup" aria-label="Objetivo da análise">
      ${INTENTS.map((item) => `
        <button type="button" class="intent-card" data-intent-id="${item.id}" role="radio" aria-checked="false">
          <strong>${item.label}</strong>
          <small>${item.hint}</small>
        </button>
      `).join('')}
    </div>
    <div id="trader-options" class="trader-options hidden">
      ${traderIntroduction()}
      <label for="trader-task">Como o Leonardo Trader deve analisar?</label>
      <select id="trader-task">
        ${TRADER_TASKS.map((task) => `<option value="${task.id}">${task.label}</option>`).join('')}
      </select>
    </div>
    <details class="analysis-preferences">
      <summary>Ajustar análise</summary>
      <div class="preference-grid">
        <label>Especialista
          <select id="expert-profile">
            ${Object.entries(PROFILE_NAMES).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}
          </select>
        </label>
        <label>Profundidade
          <select id="response-mode">
            <option value="concise">Rápida</option>
            <option value="standard">Padrão</option>
            <option value="detailed">Detalhada</option>
          </select>
        </label>
      </div>
    </details>
  `;

  questionGroup.before(section);
  bindPicker(section);
  renderContext(section);
}

function bindPicker(section) {
  section.querySelectorAll('[data-intent-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const intent = INTENTS.find((item) => item.id === button.dataset.intentId) || INTENTS[0];
      context.intentId = intent.id;
      context.profileId = intent.profileId;
      context.taskId = intent.id === 'trader'
        ? (section.querySelector('#trader-task')?.value || intent.taskId)
        : intent.taskId;
      persist();
      renderContext(section);
      updateQuestionPlaceholder();
    });
  });

  section.querySelector('#trader-task')?.addEventListener('change', (event) => {
    context.taskId = event.target.value;
    context.profileId = 'trader-analyst';
    context.intentId = 'trader';
    persist();
    renderContext(section);
  });

  section.querySelector('#expert-profile')?.addEventListener('change', (event) => {
    context.profileId = event.target.value;
    persist();
    renderContext(section);
  });

  section.querySelector('#response-mode')?.addEventListener('change', (event) => {
    context.responseMode = event.target.value;
    persist();
  });
}

function renderContext(section = document.getElementById('intent-v19')) {
  if (!section) return;
  section.querySelectorAll('[data-intent-id]').forEach((button) => {
    const active = button.dataset.intentId === context.intentId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-checked', String(active));
  });

  const trader = context.intentId === 'trader' || context.profileId === 'trader-analyst';
  section.querySelector('#trader-options')?.classList.toggle('hidden', !trader);
  const traderTask = section.querySelector('#trader-task');
  if (traderTask && TRADER_TASKS.some((task) => task.id === context.taskId)) traderTask.value = context.taskId;

  const profile = section.querySelector('#expert-profile');
  if (profile) profile.value = context.profileId;
  const responseMode = section.querySelector('#response-mode');
  if (responseMode) responseMode.value = context.responseMode;

  const expert = section.querySelector('#suggested-expert');
  if (expert) expert.textContent = `Especialista: ${PROFILE_NAMES[context.profileId] || 'Assistente geral'}`;
}

function updateQuestionPlaceholder() {
  const question = document.getElementById('question');
  if (!question) return;
  const placeholders = {
    explain: 'Ex.: Explique o conteúdo principal desta imagem.',
    diagnose: 'Ex.: Qual é o erro e como posso validar a correção?',
    architecture: 'Ex.: Avalie os componentes e os riscos desta arquitetura.',
    ux: 'Ex.: O que está confundindo o usuário nesta tela?',
    trader: 'Ex.: Mapeie os cenários de alta, baixa e neutralidade.',
  };
  question.placeholder = placeholders[context.intentId] || placeholders.explain;
}

function synchronizeJourney() {
  const preview = document.getElementById('image-preview');
  const answer = document.getElementById('answer');
  const hasImage = Boolean(preview?.getAttribute('src')) && !preview.classList.contains('hidden');
  const answerText = answer?.textContent?.trim() || '';
  const hasAnswer = Boolean(answerText) && ![
    'Aguardando análise.',
    'A resposta aparecerá aqui depois da análise.',
    'Iniciando análise…',
  ].includes(answerText);
  document.body.classList.toggle('v19-has-image', hasImage);
  document.body.classList.toggle('v19-has-answer', hasAnswer);
}

export function getAnalysisContext() {
  return { ...context };
}

readStoredContext();
installStylesheet();
buildPicker();
updateQuestionPlaceholder();

new MutationObserver(synchronizeJourney).observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ['src', 'class', 'aria-busy'],
});
synchronizeJourney();

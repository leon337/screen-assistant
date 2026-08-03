const hasDom = typeof document !== 'undefined';
const hasWindow = typeof window !== 'undefined';

const SpeechRecognitionApi = hasWindow
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

const SETTINGS_KEY = 'screen-assistant-voice-v23';
const TARGET_LANGUAGE = 'pt-BR';
const RATE_MIN = 0.6;
const RATE_MAX = 1.6;
const RATE_STEP = 0.1;
const WAKE_WINDOW_MS = 8000;
const EMPTY_ANSWERS = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
  'Iniciando análise…',
]);

let recognition = null;
let recognitionActive = false;
let commandsArmed = false;
let wakeUntil = 0;
let restartTimer = null;
let utteranceVersion = 0;
let selectedVoice = null;

const state = loadSettings();

const ui = {
  topToggle: null,
  panel: null,
  rate: null,
  rateOutput: null,
  voice: null,
  preview: null,
  commandToggle: null,
  commandStatus: null,
  summaryState: null,
};

function loadSettings() {
  const fallback = { rate: 1, voiceURI: '' };
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      rate: clampRate(Number(parsed.rate) || fallback.rate),
      voiceURI: typeof parsed.voiceURI === 'string' ? parsed.voiceURI : '',
    };
  } catch {
    return fallback;
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    rate: state.rate,
    voiceURI: state.voiceURI,
  }));
}

function clampRate(value) {
  const rounded = Math.round(Number(value) * 10) / 10;
  return Math.min(RATE_MAX, Math.max(RATE_MIN, rounded || 1));
}

function normalizeLanguageTag(value) {
  return String(value || '')
    .replace(/_/g, '-')
    .trim()
    .toLowerCase();
}

function isBrazilianPortugueseVoice(voice) {
  const language = normalizeLanguageTag(voice?.lang);
  return language === 'pt-br' || language.startsWith('pt-br-');
}

function normalizeSpeech(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function setCommandStatus(message, tone = 'neutral') {
  if (ui.commandStatus) {
    ui.commandStatus.textContent = message;
    ui.commandStatus.dataset.tone = tone;
  }
}

function updateSummary() {
  const mic = commandsArmed ? 'microfone ativo' : 'microfone desligado';
  if (ui.summaryState) ui.summaryState.textContent = `${state.rate.toFixed(1)}x · ${mic}`;
  if (ui.rateOutput) ui.rateOutput.value = `${state.rate.toFixed(1)}x`;
  if (ui.rate) ui.rate.value = String(state.rate);

  for (const button of [ui.topToggle, ui.commandToggle]) {
    if (!button) continue;
    button.setAttribute('aria-pressed', String(commandsArmed));
    button.classList.toggle('is-listening', commandsArmed);
  }

  if (ui.topToggle) ui.topToggle.textContent = commandsArmed ? '🎙 Escutando' : '🎙 Voz';
  if (ui.commandToggle) ui.commandToggle.textContent = commandsArmed
    ? 'Desativar comandos de voz'
    : 'Ativar comandos de voz';
}

function getBrazilianPortugueseVoices() {
  if (!hasWindow || !window.speechSynthesis) return [];
  return window.speechSynthesis
    .getVoices()
    .filter(isBrazilianPortugueseVoice)
    .sort((left, right) => left.name.localeCompare(right.name, TARGET_LANGUAGE));
}

function chooseDefaultVoice(voices) {
  return voices.find((voice) => voice.voiceURI === state.voiceURI)
    || voices.find((voice) => voice.localService)
    || voices[0]
    || null;
}

function populateVoices() {
  if (!ui.voice) return;

  const voices = getBrazilianPortugueseVoices();
  const previousVoiceURI = ui.voice.value || state.voiceURI;
  ui.voice.replaceChildren();

  if (!voices.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Português (Brasil) — voz padrão do sistema';
    ui.voice.append(option);
    ui.voice.disabled = true;
    selectedVoice = null;
    state.voiceURI = '';
    saveSettings();
    setCommandStatus('Nenhuma voz pt-BR foi listada pelo aparelho. A leitura solicitará a voz padrão em português do Brasil.');
    return;
  }

  ui.voice.disabled = false;
  for (const voice of voices) {
    const option = document.createElement('option');
    option.value = voice.voiceURI;
    option.textContent = `Português (Brasil) · ${voice.name}${voice.localService ? ' · aparelho' : ''}`;
    ui.voice.append(option);
  }

  selectedVoice = voices.find((voice) => voice.voiceURI === previousVoiceURI)
    || chooseDefaultVoice(voices);

  if (selectedVoice) {
    ui.voice.value = selectedVoice.voiceURI;
    state.voiceURI = selectedVoice.voiceURI;
    saveSettings();
  }
}

function setRate(value, { announce = true } = {}) {
  state.rate = clampRate(value);
  saveSettings();
  updateSummary();
  if (announce) setCommandStatus(`Velocidade ajustada para ${state.rate.toFixed(1)}x.`, 'success');
}

function answerText() {
  const answer = document.getElementById('answer');
  const text = answer?.textContent?.trim() || '';
  return EMPTY_ANSWERS.has(text) ? '' : text;
}

function stopRecognition({ preserveArmed = true } = {}) {
  clearTimeout(restartTimer);
  restartTimer = null;
  if (!preserveArmed) commandsArmed = false;

  if (!recognition) {
    recognitionActive = false;
    updateSummary();
    return;
  }

  try {
    recognition.abort();
  } catch {
    // A sessão pode já ter sido encerrada pelo navegador.
  }

  recognitionActive = false;
  updateSummary();
}

function scheduleRecognitionRestart(delay = 650) {
  clearTimeout(restartTimer);
  if (!commandsArmed || document.visibilityState !== 'visible' || window.speechSynthesis?.speaking) return;
  restartTimer = setTimeout(() => startRecognition(), delay);
}

function stopSpeech({ resumeCommands = true } = {}) {
  utteranceVersion += 1;
  window.speechSynthesis?.cancel();
  const stopButton = document.getElementById('stop-voice');
  if (stopButton) stopButton.disabled = true;
  setCommandStatus('Leitura interrompida.');
  if (resumeCommands && commandsArmed) scheduleRecognitionRestart(450);
}

function speakText(text, { preview = false } = {}) {
  const cleanText = String(text || '').trim();
  if (!cleanText) {
    setCommandStatus('Ainda não existe uma resposta disponível para leitura.', 'error');
    return false;
  }

  if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
    setCommandStatus('A leitura por voz não está disponível neste navegador.', 'error');
    return false;
  }

  const shouldResume = commandsArmed;
  if (recognitionActive) stopRecognition({ preserveArmed: true });

  utteranceVersion += 1;
  const version = utteranceVersion;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = TARGET_LANGUAGE;
  utterance.rate = state.rate;
  if (selectedVoice && isBrazilianPortugueseVoice(selectedVoice)) utterance.voice = selectedVoice;

  const stopButton = document.getElementById('stop-voice');
  if (stopButton) stopButton.disabled = false;
  setCommandStatus(preview
    ? 'Reproduzindo teste em português do Brasil.'
    : `Lendo resposta em português do Brasil, velocidade ${state.rate.toFixed(1)}x.`, 'success');

  const finish = () => {
    if (version !== utteranceVersion) return;
    if (stopButton) stopButton.disabled = true;
    setCommandStatus('Leitura concluída.');
    if (shouldResume && commandsArmed) scheduleRecognitionRestart(550);
  };

  utterance.onend = finish;
  utterance.onerror = () => {
    if (version !== utteranceVersion) return;
    if (stopButton) stopButton.disabled = true;
    setCommandStatus('Não foi possível concluir a leitura em português do Brasil.', 'error');
    if (shouldResume && commandsArmed) scheduleRecognitionRestart(550);
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

function actionButton(...ids) {
  for (const id of ids) {
    const button = document.getElementById(id);
    if (button && !button.disabled) return button;
  }
  return null;
}

function clickAction(ids, successMessage, unavailableMessage) {
  const button = actionButton(...ids);
  if (!button) {
    setCommandStatus(unavailableMessage, 'error');
    return false;
  }
  button.click();
  setCommandStatus(successMessage, 'success');
  return true;
}

function commandHelp() {
  speakText('Comandos disponíveis: ler resposta, parar voz, mais rápido, mais devagar, velocidade normal, analisar, nova análise, repetir análise e desativar comandos.');
}

function executeCommand(rawCommand) {
  const command = normalizeSpeech(rawCommand);
  wakeUntil = 0;

  if (!command) {
    setCommandStatus('Pode falar o comando agora. A janela ficará aberta por oito segundos.', 'success');
    wakeUntil = Date.now() + WAKE_WINDOW_MS;
    return true;
  }

  if (/^(desativar|desligar) (os )?comandos/.test(command) || command === 'desativar voz') {
    disarmCommands('Comandos de voz desativados.');
    return true;
  }
  if (command.includes('ajuda') || command.includes('quais comandos')) {
    commandHelp();
    return true;
  }
  if (command.includes('velocidade normal') || command.includes('voz normal')) {
    setRate(1);
    return true;
  }
  if (command.includes('mais rapido') || command.includes('aumentar velocidade') || command.includes('acelerar voz')) {
    setRate(state.rate + RATE_STEP);
    return true;
  }
  if (command.includes('mais devagar') || command.includes('diminuir velocidade') || command.includes('reduzir velocidade')) {
    setRate(state.rate - RATE_STEP);
    return true;
  }
  if (command.includes('parar') || command.includes('interromper voz')) {
    stopSpeech();
    return true;
  }
  if (command.includes('ler resposta') || command.includes('ouvir resposta') || command === 'ler') {
    return speakText(answerText());
  }
  if (command.includes('nova analise') || command.includes('analisar outra imagem')) {
    return clickAction(['new-analysis'], 'Nova análise iniciada.', 'O comando Nova análise não está disponível agora.');
  }
  if (command.includes('repetir analise') || command.includes('analisar novamente')) {
    return clickAction(['repeat-analysis'], 'Análise repetida com o contexto atual.', 'Selecione uma imagem e um objetivo antes de repetir.');
  }
  if (command === 'analisar' || command.includes('analisar imagem') || command.includes('iniciar analise')) {
    return clickAction(['analyze', 'bar-analyze'], 'Análise iniciada.', 'Selecione uma imagem e um objetivo antes de analisar.');
  }
  if (command.includes('ir para resultado') || command === 'resultado') {
    const route = document.querySelector('[data-premium-route="result"]');
    if (route) {
      route.click();
      setCommandStatus('Abrindo resultado.', 'success');
      return true;
    }
  }

  setCommandStatus(`Comando não reconhecido: “${rawCommand.trim()}”. Diga “Screen Assistente, ajuda”.`, 'error');
  return false;
}

function splitWakePhrase(transcript) {
  const normalized = normalizeSpeech(transcript);
  const wakePatterns = [
    /\b(?:ei\s+)?screen assistant\b/,
    /\b(?:ei\s+)?screen assistente\b/,
    /\b(?:ei\s+)?screen assistent\b/,
    /\b(?:ei\s+)?escreen assistant\b/,
    /\b(?:ei\s+)?scrim assistente\b/,
    /\b(?:ei\s+)?escrim assistente\b/,
  ];

  for (const pattern of wakePatterns) {
    const match = normalized.match(pattern);
    if (match) return normalized.slice((match.index || 0) + match[0].length).trim();
  }

  return null;
}

function chooseTranscript(result) {
  const alternatives = [];
  for (let index = 0; index < result.length; index += 1) {
    const transcript = result[index]?.transcript?.trim();
    if (transcript) alternatives.push(transcript);
  }

  return alternatives.find((transcript) => splitWakePhrase(transcript) !== null)
    || alternatives[0]
    || '';
}

function handleTranscript(transcript) {
  const afterWake = splitWakePhrase(transcript);
  if (afterWake !== null) {
    executeCommand(afterWake);
    return;
  }

  if (Date.now() <= wakeUntil) {
    executeCommand(transcript);
    return;
  }

  setCommandStatus(`Ouvi “${transcript.trim()}”. Comece com “Screen Assistente”.`);
}

function createRecognition() {
  if (!SpeechRecognitionApi) return null;

  const instance = new SpeechRecognitionApi();
  instance.lang = TARGET_LANGUAGE;
  instance.continuous = false;
  instance.interimResults = false;
  instance.maxAlternatives = 5;

  instance.onstart = () => {
    recognitionActive = true;
    setCommandStatus('Escutando em português do Brasil. Diga “Screen Assistente” antes do comando.', 'success');
    updateSummary();
  };

  instance.onresult = (event) => {
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (!result.isFinal) continue;
      const transcript = chooseTranscript(result);
      if (transcript) handleTranscript(transcript);
    }
  };

  instance.onerror = (event) => {
    recognitionActive = false;
    const permanent = ['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error);

    if (permanent) {
      commandsArmed = false;
      setCommandStatus('O microfone não pôde ser ativado. Verifique a permissão do navegador.', 'error');
      updateSummary();
      return;
    }

    if (event.error === 'no-speech') {
      setCommandStatus('Nenhuma fala foi detectada. Continuarei escutando.', 'neutral');
      return;
    }

    if (event.error !== 'aborted') {
      setCommandStatus(`Reconhecimento interrompido: ${event.error}.`, 'error');
    }
  };

  instance.onend = () => {
    recognitionActive = false;
    updateSummary();
    if (commandsArmed && !window.speechSynthesis?.speaking) scheduleRecognitionRestart();
  };

  return instance;
}

function startRecognition() {
  if (!SpeechRecognitionApi) {
    commandsArmed = false;
    setCommandStatus('Comandos de voz não estão disponíveis neste navegador.', 'error');
    updateSummary();
    return false;
  }

  if (document.visibilityState !== 'visible') return false;
  if (recognitionActive || window.speechSynthesis?.speaking) return true;

  recognition ||= createRecognition();

  try {
    recognition.start();
    return true;
  } catch (error) {
    if (error?.name !== 'InvalidStateError') {
      commandsArmed = false;
      setCommandStatus('Não foi possível iniciar o microfone.', 'error');
      updateSummary();
    }
    return false;
  }
}

function armCommands() {
  if (!SpeechRecognitionApi) {
    setCommandStatus('Este navegador permite ouvir respostas, mas não oferece comandos de voz.', 'error');
    return;
  }

  commandsArmed = true;
  updateSummary();
  startRecognition();
}

function disarmCommands(message = 'Comandos de voz desativados.') {
  commandsArmed = false;
  wakeUntil = 0;
  stopRecognition({ preserveArmed: false });
  setCommandStatus(message);
  updateSummary();
}

function toggleCommands() {
  if (commandsArmed) disarmCommands();
  else armCommands();
}

function syncTogglePlacement() {
  if (!ui.topToggle) return;
  const mobile = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  const target = mobile
    ? document.querySelector('.premium-top-actions')
    : document.querySelector('.header-actions');
  if (target && ui.topToggle.parentElement !== target) target.prepend(ui.topToggle);
}

function buildInterface() {
  const responseActions = document.querySelector('.response-actions');
  if (!responseActions || document.getElementById('voice-settings-v23')) return false;

  ui.topToggle = document.createElement('button');
  ui.topToggle.id = 'voice-command-toggle-v23';
  ui.topToggle.className = 'premium-icon-button voice-command-toggle-v23';
  ui.topToggle.type = 'button';
  ui.topToggle.setAttribute('aria-pressed', 'false');
  ui.topToggle.textContent = '🎙 Voz';
  ui.topToggle.addEventListener('click', toggleCommands);

  ui.panel = document.createElement('details');
  ui.panel.id = 'voice-settings-v23';
  ui.panel.className = 'voice-settings-v23';
  ui.panel.innerHTML = `
    <summary>
      <span>Voz e comandos</span>
      <small id="voice-summary-state-v23">1.0x · microfone desligado</small>
    </summary>
    <div class="voice-settings-body-v23">
      <div class="voice-control-v23">
        <div class="voice-control-heading-v23">
          <label for="voice-rate-v23">Velocidade da leitura</label>
          <output id="voice-rate-output-v23" for="voice-rate-v23">1.0x</output>
        </div>
        <input id="voice-rate-v23" type="range" min="${RATE_MIN}" max="${RATE_MAX}" step="${RATE_STEP}" value="${state.rate}" aria-describedby="voice-rate-help-v23">
        <small id="voice-rate-help-v23">Mais lenta à esquerda; mais rápida à direita.</small>
      </div>
      <div class="voice-control-v23">
        <label for="voice-select-v23">Voz em português (Brasil)</label>
        <select id="voice-select-v23"></select>
        <small>Somente vozes pt-BR são exibidas nesta fase.</small>
        <button id="voice-preview-v23" class="secondary" type="button">Testar voz</button>
      </div>
      <div class="voice-command-card-v23">
        <div>
          <strong>Comandos de voz</strong>
          <span>Ative uma vez e depois diga “Screen Assistente, ler resposta”.</span>
        </div>
        <button id="voice-command-panel-toggle-v23" class="secondary" type="button" aria-pressed="false">Ativar comandos de voz</button>
        <p id="voice-command-status-v23" class="voice-command-status-v23" aria-live="polite">Microfone desligado.</p>
        <details class="voice-command-help-v23">
          <summary>Ver comandos disponíveis</summary>
          <ul>
            <li>Screen Assistente, ler resposta</li>
            <li>Screen Assistente, parar voz</li>
            <li>Screen Assistente, mais rápido</li>
            <li>Screen Assistente, mais devagar</li>
            <li>Screen Assistente, velocidade normal</li>
            <li>Screen Assistente, analisar</li>
            <li>Screen Assistente, nova análise</li>
            <li>Screen Assistente, repetir análise</li>
          </ul>
        </details>
        <small>O microfone funciona enquanto esta página está visível. O reconhecimento está configurado para português do Brasil.</small>
      </div>
    </div>`;

  responseActions.insertAdjacentElement('afterend', ui.panel);
  ui.rate = document.getElementById('voice-rate-v23');
  ui.rateOutput = document.getElementById('voice-rate-output-v23');
  ui.voice = document.getElementById('voice-select-v23');
  ui.preview = document.getElementById('voice-preview-v23');
  ui.commandToggle = document.getElementById('voice-command-panel-toggle-v23');
  ui.commandStatus = document.getElementById('voice-command-status-v23');
  ui.summaryState = document.getElementById('voice-summary-state-v23');

  ui.rate.addEventListener('input', () => setRate(ui.rate.value, { announce: false }));
  ui.rate.addEventListener('change', () => setRate(ui.rate.value));
  ui.voice.addEventListener('change', () => {
    const voices = getBrazilianPortugueseVoices();
    selectedVoice = voices.find((voice) => voice.voiceURI === ui.voice.value) || null;
    state.voiceURI = selectedVoice?.voiceURI || '';
    saveSettings();
    setCommandStatus(`Voz pt-BR selecionada: ${selectedVoice?.name || 'padrão do sistema'}.`, 'success');
  });
  ui.preview.addEventListener('click', () => speakText('Olá. Esta é uma demonstração da voz em português do Brasil.', { preview: true }));
  ui.commandToggle.addEventListener('click', toggleCommands);

  syncTogglePlacement();
  updateSummary();
  populateVoices();
  return true;
}

function interceptLegacyVoiceButtons() {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!target) return;

    if (target.id === 'speak-answer') {
      event.preventDefault();
      event.stopImmediatePropagation();
      speakText(answerText());
    }

    if (target.id === 'stop-voice') {
      event.preventDefault();
      event.stopImmediatePropagation();
      stopSpeech();
    }
  }, true);
}

function initialize() {
  if (!hasDom || !hasWindow) return;
  if (!buildInterface()) return;

  interceptLegacyVoiceButtons();
  window.speechSynthesis?.addEventListener?.('voiceschanged', populateVoices);
  window.matchMedia('(max-width: 900px), (pointer: coarse)').addEventListener('change', syncTogglePlacement);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      disarmCommands('Comandos desligados porque a página saiu de primeiro plano.');
    }
  });

  window.addEventListener('beforeunload', () => {
    commandsArmed = false;
    stopRecognition({ preserveArmed: false });
    window.speechSynthesis?.cancel();
  });

  if (!window.speechSynthesis) {
    ui.preview.disabled = true;
    ui.rate.disabled = true;
    ui.voice.disabled = true;
    setCommandStatus('Leitura por voz indisponível neste navegador.', 'error');
  } else if (!SpeechRecognitionApi) {
    ui.commandToggle.disabled = true;
    ui.topToggle.disabled = true;
    setCommandStatus('Leitura pt-BR disponível. Comandos falados não são suportados neste navegador.');
  }
}

initialize();

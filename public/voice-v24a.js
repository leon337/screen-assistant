const hasDom = typeof document !== 'undefined';
const hasWindow = typeof window !== 'undefined';

const EMPTY_ANSWERS = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
  'Iniciando análise…',
]);

const ui = {
  dock: null,
  micButton: null,
  speechButton: null,
  rateButton: null,
  settingsButton: null,
  liveState: null,
  sheet: null,
  sheetClose: null,
  legacyTopToggle: null,
  legacyCommandToggle: null,
  legacySpeak: null,
  legacyStop: null,
  voiceSelect: null,
  currentVoice: null,
};

const observers = [];
let selectObserver = null;

function naturalVoice() {
  return hasWindow ? window.screenAssistantNaturalVoice : null;
}

function isMicActive() {
  const source = ui.legacyTopToggle || ui.legacyCommandToggle;
  return source?.getAttribute('aria-pressed') === 'true';
}

function isSpeaking() {
  return Boolean(naturalVoice()?.isSpeaking?.() || hasWindow && window.speechSynthesis?.speaking);
}

function isGeneratingNaturalVoice() {
  return Boolean(naturalVoice()?.isBusy?.() && !naturalVoice()?.isSpeaking?.());
}

function currentRate() {
  const output = document.getElementById('voice-rate-output-v23');
  return output?.value || output?.textContent || '1.0x';
}

function answerReady() {
  const answer = document.getElementById('answer');
  const text = answer?.textContent?.trim() || '';
  const busy = answer?.getAttribute('aria-busy') === 'true';
  return Boolean(text && !busy && !EMPTY_ANSWERS.has(text));
}

function shouldShowDock() {
  return document.body.dataset.premiumScreen === 'result' && answerReady();
}

function updateDock() {
  const micActive = isMicActive();
  const speaking = isSpeaking();
  const generating = isGeneratingNaturalVoice();
  const rate = currentRate();

  if (ui.dock) ui.dock.hidden = !shouldShowDock();

  if (ui.micButton) {
    ui.micButton.setAttribute('aria-pressed', String(micActive));
    ui.micButton.classList.toggle('is-active', micActive);
    ui.micButton.querySelector('[data-label]').textContent = micActive ? 'Mic ativo' : 'Mic';
  }

  if (ui.speechButton) {
    ui.speechButton.classList.toggle('is-active', speaking || generating);
    ui.speechButton.disabled = !answerReady();
    ui.speechButton.querySelector('[data-label]').textContent = speaking
      ? 'Parar'
      : generating
        ? 'Gerando…'
        : 'Ouvir';
    ui.speechButton.setAttribute('aria-label', speaking || generating
      ? 'Interromper leitura'
      : 'Ouvir resposta');
  }

  if (ui.rateButton) ui.rateButton.textContent = rate;
  if (ui.liveState) {
    const voiceMode = naturalVoice()?.getMode?.() === 'device' ? 'voz do aparelho' : 'voz natural';
    const microphone = micActive ? 'microfone ativo' : 'microfone desligado';
    const playback = speaking ? 'lendo resposta' : generating ? 'gerando áudio' : 'leitura parada';
    ui.liveState.textContent = `${voiceMode}, ${microphone}, ${playback}, velocidade ${rate}`;
  }

  document.body.dataset.voiceMic = micActive ? 'active' : 'inactive';
  document.body.dataset.voiceSpeech = speaking ? 'speaking' : generating ? 'generating' : 'idle';
}

function openSheet() {
  if (!ui.sheet) return;
  if (typeof ui.sheet.showModal === 'function') {
    if (!ui.sheet.open) ui.sheet.showModal();
  } else {
    ui.sheet.setAttribute('open', '');
  }
  document.body.classList.add('voice-sheet-open-v24a');
  ui.sheetClose?.focus();
}

function closeSheet() {
  if (!ui.sheet) return;
  if (typeof ui.sheet.close === 'function' && ui.sheet.open) ui.sheet.close();
  else ui.sheet.removeAttribute('open');
  document.body.classList.remove('voice-sheet-open-v24a');
  ui.settingsButton?.focus();
}

function triggerLegacy(button) {
  if (!button || button.disabled) return false;
  button.click();
  window.setTimeout(updateDock, 80);
  return true;
}

function toggleMicrophone() {
  triggerLegacy(ui.legacyTopToggle || ui.legacyCommandToggle);
}

async function toggleSpeech() {
  const natural = naturalVoice();

  if (natural?.isBusy?.()) {
    natural.stop?.();
    updateDock();
    return;
  }

  if (window.speechSynthesis?.speaking) {
    triggerLegacy(ui.legacyStop);
    return;
  }

  if (natural?.getMode?.() === 'natural') {
    const handled = await natural.speakAnswer();
    if (!handled) triggerLegacy(ui.legacySpeak);
    updateDock();
    return;
  }

  triggerLegacy(ui.legacySpeak);
}

function shortVoiceName(text) {
  const parts = String(text || '')
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return 'Voz do aparelho';
  if (parts.length === 1) {
    return parts[0]
      .replace(/^Português \(Brasil\)\s*[—-]\s*/i, '')
      .replace(/voz padrão do sistema/i, 'Voz do aparelho');
  }
  return parts.find((part) => !/português|aparelho/i.test(part)) || 'Voz do aparelho';
}

function updateVoiceLabels() {
  if (!ui.voiceSelect) return;

  for (const option of ui.voiceSelect.options) {
    const fullLabel = option.dataset.fullLabel || option.textContent || '';
    option.dataset.fullLabel = fullLabel;
    const shortLabel = shortVoiceName(fullLabel);
    if (option.textContent !== shortLabel) option.textContent = shortLabel;
    option.title = fullLabel;
  }

  const voiceControl = ui.voiceSelect.closest('.voice-control-v23');
  const label = voiceControl?.querySelector('label');
  const helper = voiceControl?.querySelector('small');
  const onlyOneVoice = ui.voiceSelect.options.length <= 1;

  ui.voiceSelect.hidden = onlyOneVoice;
  if (helper) helper.hidden = onlyOneVoice;
  if (label) label.textContent = onlyOneVoice ? 'Voz do aparelho' : 'Voz do aparelho em português';

  if (ui.currentVoice && !naturalVoice()) {
    const selected = ui.voiceSelect.selectedOptions?.[0];
    ui.currentVoice.textContent = `${selected?.textContent?.trim() || 'Voz do aparelho'} · Português (Brasil)`;
  }
}

function moveLegacyPanelIntoSheet() {
  const legacyPanel = document.getElementById('voice-settings-v23');
  const legacyBody = legacyPanel?.querySelector('.voice-settings-body-v23');
  if (!legacyPanel || !legacyBody) return false;

  ui.sheet = document.createElement('dialog');
  ui.sheet.id = 'voice-settings-v24a';
  ui.sheet.className = 'voice-sheet-v24a';
  ui.sheet.setAttribute('aria-labelledby', 'voice-sheet-title-v24a');
  ui.sheet.innerHTML = `
    <section class="voice-sheet-card-v24a">
      <header class="voice-sheet-header-v24a">
        <div>
          <small>VOZ</small>
          <h2 id="voice-sheet-title-v24a">Voz e comandos</h2>
        </div>
        <button id="voice-sheet-close-v24a" class="voice-sheet-close-v24a" type="button" aria-label="Fechar ajustes de voz">Fechar</button>
      </header>
      <p id="voice-current-v24a" class="voice-current-v24a">Voz natural · Português (Brasil)</p>
      <div id="voice-sheet-content-v24a"></div>
    </section>`;

  document.body.append(ui.sheet);
  ui.sheet.querySelector('#voice-sheet-content-v24a')?.append(legacyBody);
  legacyPanel.hidden = true;

  ui.sheetClose = document.getElementById('voice-sheet-close-v24a');
  ui.currentVoice = document.getElementById('voice-current-v24a');
  ui.sheetClose?.addEventListener('click', closeSheet);
  ui.sheet.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeSheet();
  });
  ui.sheet.addEventListener('click', (event) => {
    if (event.target === ui.sheet) closeSheet();
  });

  return true;
}

function buildDock() {
  const responseActions = document.querySelector('.response-actions');
  if (!responseActions || document.getElementById('voice-dock-v24a')) return false;

  ui.dock = document.createElement('section');
  ui.dock.id = 'voice-dock-v24a';
  ui.dock.className = 'voice-dock-v24a';
  ui.dock.hidden = true;
  ui.dock.setAttribute('aria-label', 'Controles rápidos de voz');
  ui.dock.innerHTML = `
    <div class="voice-dock-actions-v24a">
      <button id="voice-mic-v24a" type="button" aria-pressed="false"><span aria-hidden="true">●</span><span data-label>Mic</span></button>
      <button id="voice-speech-v24a" type="button"><span aria-hidden="true">▶</span><span data-label>Ouvir</span></button>
      <button id="voice-rate-v24a" type="button" aria-label="Abrir velocidade da leitura">1.0x</button>
      <button id="voice-settings-open-v24a" type="button" aria-label="Abrir ajustes de voz">Ajustes</button>
    </div>
    <span id="voice-live-state-v24a" class="sr-only" aria-live="polite"></span>`;

  responseActions.insertAdjacentElement('afterend', ui.dock);
  ui.micButton = document.getElementById('voice-mic-v24a');
  ui.speechButton = document.getElementById('voice-speech-v24a');
  ui.rateButton = document.getElementById('voice-rate-v24a');
  ui.settingsButton = document.getElementById('voice-settings-open-v24a');
  ui.liveState = document.getElementById('voice-live-state-v24a');

  ui.micButton?.addEventListener('click', toggleMicrophone);
  ui.speechButton?.addEventListener('click', toggleSpeech);
  ui.rateButton?.addEventListener('click', openSheet);
  ui.settingsButton?.addEventListener('click', openSheet);
  return true;
}

function observe(element, options) {
  if (!element) return;
  const observer = new MutationObserver(updateDock);
  observer.observe(element, options);
  observers.push(observer);
}

function connectLegacyControls() {
  ui.legacyTopToggle = document.getElementById('voice-command-toggle-v23');
  ui.legacyCommandToggle = document.getElementById('voice-command-panel-toggle-v23');
  ui.legacySpeak = document.getElementById('speak-answer');
  ui.legacyStop = document.getElementById('stop-voice');
  ui.voiceSelect = document.getElementById('voice-select-v23');

  observe(ui.legacyTopToggle, { attributes: true, attributeFilter: ['aria-pressed', 'disabled'] });
  observe(ui.legacyCommandToggle, { attributes: true, attributeFilter: ['aria-pressed', 'disabled'] });
  observe(ui.legacyStop, { attributes: true, attributeFilter: ['disabled'] });
  observe(document.body, { attributes: true, attributeFilter: ['data-premium-screen'] });
  observe(document.getElementById('answer'), {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-busy'],
  });

  const rate = document.getElementById('voice-rate-v23');
  rate?.addEventListener('input', updateDock);
  rate?.addEventListener('change', updateDock);

  if (ui.voiceSelect) {
    ui.voiceSelect.addEventListener('change', updateVoiceLabels);
    selectObserver = new MutationObserver(updateVoiceLabels);
    selectObserver.observe(ui.voiceSelect, { childList: true, subtree: true });
    updateVoiceLabels();
  }

  document.addEventListener('screen-assistant-natural-voice-change', updateDock);
}

function initialize() {
  if (!hasDom || !hasWindow) return;
  if (!buildDock()) return;

  connectLegacyControls();
  if (!moveLegacyPanelIntoSheet()) return;
  updateVoiceLabels();

  document.body.classList.add('voice-v24a-ready');
  document.body.dataset.voiceDesign = 'phase-24a-natural';
  updateDock();

  window.addEventListener('beforeunload', () => {
    observers.forEach((observer) => observer.disconnect());
    selectObserver?.disconnect();
  });
}

initialize();

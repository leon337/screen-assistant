const hasDom = typeof document !== 'undefined';
const hasWindow = typeof window !== 'undefined';

const ui = {
  dock: null,
  micButton: null,
  speechButton: null,
  rateButton: null,
  settingsButton: null,
  micState: null,
  speechState: null,
  sheet: null,
  sheetClose: null,
  legacyTopToggle: null,
  legacyCommandToggle: null,
  legacySpeak: null,
  legacyStop: null,
  voiceSelect: null,
  currentVoice: null,
};

let speechPoll = null;
let selectObserver = null;

function isMicActive() {
  const source = ui.legacyTopToggle || ui.legacyCommandToggle;
  return source?.getAttribute('aria-pressed') === 'true';
}

function isSpeaking() {
  return Boolean(hasWindow && window.speechSynthesis?.speaking);
}

function currentRate() {
  const output = document.getElementById('voice-rate-output-v23');
  return output?.value || output?.textContent || '1.0x';
}

function updateDock() {
  const micActive = isMicActive();
  const speaking = isSpeaking();
  const rate = currentRate();

  if (ui.micButton) {
    ui.micButton.setAttribute('aria-pressed', String(micActive));
    ui.micButton.classList.toggle('is-active', micActive);
    ui.micButton.textContent = micActive ? '🎙 Desligar' : '🎙 Escutar';
  }

  if (ui.speechButton) {
    ui.speechButton.classList.toggle('is-active', speaking);
    ui.speechButton.textContent = speaking ? '■ Parar' : '▶ Ouvir';
    ui.speechButton.setAttribute('aria-label', speaking ? 'Interromper leitura' : 'Ouvir resposta');
  }

  if (ui.rateButton) ui.rateButton.textContent = rate;
  if (ui.micState) ui.micState.textContent = micActive ? 'Microfone ativo' : 'Microfone desligado';
  if (ui.speechState) ui.speechState.textContent = speaking ? 'Lendo resposta' : 'Leitura parada';

  document.body.dataset.voiceMic = micActive ? 'active' : 'inactive';
  document.body.dataset.voiceSpeech = speaking ? 'speaking' : 'idle';
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

function toggleSpeech() {
  if (isSpeaking()) triggerLegacy(ui.legacyStop);
  else triggerLegacy(ui.legacySpeak);
}

function shortVoiceName(text) {
  const parts = String(text || '')
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return 'Português (Brasil)';
  if (parts.length === 1) return parts[0].replace(/\s+—\s+voz padrão do sistema$/i, '');
  return parts[1] || parts[0];
}

function updateVoiceLabels() {
  if (!ui.voiceSelect) return;

  for (const option of ui.voiceSelect.options) {
    const fullLabel = option.dataset.fullLabel || option.textContent || '';
    option.dataset.fullLabel = fullLabel;
    option.textContent = shortVoiceName(fullLabel);
    option.title = fullLabel;
  }

  const selected = ui.voiceSelect.selectedOptions?.[0];
  if (ui.currentVoice) {
    const name = selected?.textContent?.trim() || 'Voz padrão';
    ui.currentVoice.textContent = `${name} · Português (Brasil)`;
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
          <small>ACESSIBILIDADE</small>
          <h2 id="voice-sheet-title-v24a">Voz e comandos</h2>
        </div>
        <button id="voice-sheet-close-v24a" class="voice-sheet-close-v24a" type="button" aria-label="Fechar ajustes de voz">✕</button>
      </header>
      <p class="voice-sheet-intro-v24a">Ajuste a leitura e os comandos sem ocupar a tela do resultado.</p>
      <p id="voice-current-v24a" class="voice-current-v24a">Português (Brasil)</p>
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
  ui.dock.setAttribute('aria-label', 'Controles rápidos de voz');
  ui.dock.innerHTML = `
    <div class="voice-dock-state-v24a" aria-live="polite">
      <span id="voice-mic-state-v24a">Microfone desligado</span>
      <span aria-hidden="true">·</span>
      <span id="voice-speech-state-v24a">Leitura parada</span>
    </div>
    <div class="voice-dock-actions-v24a">
      <button id="voice-mic-v24a" type="button" aria-pressed="false">🎙 Escutar</button>
      <button id="voice-speech-v24a" type="button">▶ Ouvir</button>
      <button id="voice-rate-v24a" type="button" aria-label="Abrir velocidade da leitura">1.0x</button>
      <button id="voice-settings-open-v24a" type="button" aria-label="Abrir ajustes de voz">⚙ Ajustes</button>
    </div>`;

  responseActions.insertAdjacentElement('afterend', ui.dock);
  ui.micButton = document.getElementById('voice-mic-v24a');
  ui.speechButton = document.getElementById('voice-speech-v24a');
  ui.rateButton = document.getElementById('voice-rate-v24a');
  ui.settingsButton = document.getElementById('voice-settings-open-v24a');
  ui.micState = document.getElementById('voice-mic-state-v24a');
  ui.speechState = document.getElementById('voice-speech-state-v24a');

  ui.micButton?.addEventListener('click', toggleMicrophone);
  ui.speechButton?.addEventListener('click', toggleSpeech);
  ui.rateButton?.addEventListener('click', openSheet);
  ui.settingsButton?.addEventListener('click', openSheet);
  return true;
}

function connectLegacyControls() {
  ui.legacyTopToggle = document.getElementById('voice-command-toggle-v23');
  ui.legacyCommandToggle = document.getElementById('voice-command-panel-toggle-v23');
  ui.legacySpeak = document.getElementById('speak-answer');
  ui.legacyStop = document.getElementById('stop-voice');
  ui.voiceSelect = document.getElementById('voice-select-v23');

  const observePressed = (element) => {
    if (!element) return;
    new MutationObserver(updateDock).observe(element, {
      attributes: true,
      attributeFilter: ['aria-pressed', 'disabled'],
    });
  };

  observePressed(ui.legacyTopToggle);
  observePressed(ui.legacyCommandToggle);

  const rate = document.getElementById('voice-rate-v23');
  rate?.addEventListener('input', updateDock);
  rate?.addEventListener('change', updateDock);

  if (ui.voiceSelect) {
    ui.voiceSelect.addEventListener('change', updateVoiceLabels);
    selectObserver = new MutationObserver(updateVoiceLabels);
    selectObserver.observe(ui.voiceSelect, { childList: true, subtree: true });
    updateVoiceLabels();
  }
}

function initialize() {
  if (!hasDom || !hasWindow) return;
  if (!buildDock()) return;

  connectLegacyControls();
  if (!moveLegacyPanelIntoSheet()) return;

  document.body.classList.add('voice-v24a-ready');
  document.body.dataset.voiceDesign = 'phase-24a';

  speechPoll = window.setInterval(updateDock, 250);
  updateDock();

  window.addEventListener('beforeunload', () => {
    window.clearInterval(speechPoll);
    selectObserver?.disconnect();
  });
}

initialize();

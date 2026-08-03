import { getAccessToken, signOut } from './auth-v20.js';
import { readApiResponse } from './http.js';

const SETTINGS_KEY = 'screen-assistant-natural-voice-v24a';
const MAX_CLIENT_CHARS = 4000;
const EMPTY_ANSWERS = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
  'Iniciando análise…',
]);

const hasWindow = typeof window !== 'undefined';
const player = hasWindow ? new Audio() : null;
let objectUrl = '';
let generating = false;
let commandsWereArmed = false;
let requestController = null;

const state = loadSettings();

function loadSettings() {
  if (!hasWindow) return { mode: 'natural' };
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { mode: parsed.mode === 'device' ? 'device' : 'natural' };
  } catch {
    return { mode: 'natural' };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode: state.mode }));
}

function dispatchState() {
  document.dispatchEvent(new CustomEvent('screen-assistant-natural-voice-change', {
    detail: {
      mode: state.mode,
      speaking: isSpeaking(),
      generating,
    },
  }));
}

function setStatus(message, tone = 'neutral') {
  const status = document.getElementById('voice-command-status-v23');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function answerText() {
  const answer = document.getElementById('answer');
  const text = answer?.textContent?.trim() || '';
  if (!text || EMPTY_ANSWERS.has(text)) return '';
  return text
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_CLIENT_CHARS);
}

function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function pcmBase64ToWavBlob(audioBase64, {
  sampleRate = 24000,
  channels = 1,
  sampleWidth = 2,
} = {}) {
  const pcm = base64ToBytes(audioBase64);
  const headerBytes = 44;
  const buffer = new ArrayBuffer(headerBytes + pcm.length);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const blockAlign = channels * sampleWidth;
  const byteRate = sampleRate * blockAlign;

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, sampleWidth * 8, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, pcm.length, true);
  bytes.set(pcm, headerBytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

function currentRate() {
  const input = document.getElementById('voice-rate-v23');
  const parsed = Number(input?.value || 1);
  return Number.isFinite(parsed) ? parsed : 1;
}

function revokeObjectUrl() {
  if (!objectUrl) return;
  URL.revokeObjectURL(objectUrl);
  objectUrl = '';
}

function commandToggle() {
  return document.getElementById('voice-command-panel-toggle-v23')
    || document.getElementById('voice-command-toggle-v23');
}

function pauseCommands() {
  const toggle = commandToggle();
  commandsWereArmed = toggle?.getAttribute('aria-pressed') === 'true';
  if (commandsWereArmed && !toggle.disabled) toggle.click();
}

function resumeCommands() {
  if (!commandsWereArmed || document.visibilityState !== 'visible') return;
  const toggle = commandToggle();
  commandsWereArmed = false;
  if (toggle && !toggle.disabled && toggle.getAttribute('aria-pressed') !== 'true') {
    window.setTimeout(() => toggle.click(), 450);
  }
}

function cleanupPlayback({ resume = true } = {}) {
  if (player) {
    player.pause();
    player.removeAttribute('src');
    player.load();
  }
  revokeObjectUrl();
  generating = false;
  if (resume) resumeCommands();
  dispatchState();
}

async function requestNaturalAudio(text, signal) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('Entre na sua conta para usar a voz natural.');

  const response = await fetch('/api/v1/synthesize-speech', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      'x-request-id': crypto.randomUUID(),
    },
    body: JSON.stringify({ text }),
    cache: 'no-store',
    signal,
  });

  const payload = await readApiResponse(response);
  if (!response.ok) {
    if (response.status === 401) await signOut();
    throw new Error(payload.error?.message || 'Não foi possível gerar a voz natural.');
  }
  return payload.data;
}

export function stopNaturalSpeech({ resume = true, announce = true } = {}) {
  requestController?.abort();
  requestController = null;
  if (!player) return;
  cleanupPlayback({ resume });
  if (announce) setStatus('Leitura interrompida.');
}

export function isSpeaking() {
  return Boolean(player && !player.paused && !player.ended && player.currentTime >= 0);
}

export function isBusy() {
  return generating || isSpeaking();
}

export function getMode() {
  return state.mode;
}

export function setMode(mode) {
  state.mode = mode === 'device' ? 'device' : 'natural';
  saveSettings();
  updateModeUi();
  setStatus(
    state.mode === 'natural'
      ? 'Voz natural ativada. Em caso de falha, a voz do aparelho será usada.'
      : 'Voz do aparelho ativada.',
    'success',
  );
  dispatchState();
}

export function setNaturalPlaybackRate(rate) {
  if (player) player.playbackRate = Number(rate) || 1;
  dispatchState();
}

export async function speakAnswerNaturally() {
  if (state.mode !== 'natural') return false;
  const text = answerText();
  if (!text) {
    setStatus('Ainda não existe uma resposta disponível para leitura.', 'error');
    return true;
  }

  stopNaturalSpeech({ resume: false, announce: false });
  window.speechSynthesis?.cancel();
  pauseCommands();
  requestController = new AbortController();
  generating = true;
  setStatus('Preparando voz natural em português do Brasil…', 'success');
  dispatchState();

  try {
    const data = await requestNaturalAudio(text, requestController.signal);
    requestController = null;
    const wav = pcmBase64ToWavBlob(data.audioBase64, {
      sampleRate: data.sampleRate,
      channels: data.channels,
      sampleWidth: data.sampleWidth,
    });
    objectUrl = URL.createObjectURL(wav);
    player.src = objectUrl;
    player.playbackRate = currentRate();
    player.onended = () => {
      setStatus('Leitura natural concluída.');
      cleanupPlayback();
    };
    player.onerror = () => {
      setStatus('A voz natural falhou. Usando a voz do aparelho.', 'error');
      cleanupPlayback();
      document.getElementById('speak-answer')?.click();
    };
    await player.play();
    generating = false;
    setStatus(`Lendo com voz natural em ${player.playbackRate.toFixed(1)}x.`, 'success');
    dispatchState();
    return true;
  } catch (error) {
    const cancelled = error?.name === 'AbortError';
    requestController = null;
    cleanupPlayback();
    if (cancelled) {
      setStatus('Geração da voz cancelada.');
      return true;
    }
    setStatus(`${error instanceof Error ? error.message : 'A voz natural falhou.'} Usando a voz do aparelho.`, 'error');
    return false;
  }
}

function updateModeUi() {
  for (const button of document.querySelectorAll('[data-natural-voice-mode]')) {
    const active = button.dataset.naturalVoiceMode === state.mode;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('is-active', active);
  }

  const current = document.getElementById('voice-current-v24a');
  if (current) {
    current.textContent = state.mode === 'natural'
      ? 'Voz natural · Português (Brasil)'
      : 'Voz do aparelho · Português (Brasil)';
  }
}

function mountModeUi() {
  const content = document.getElementById('voice-sheet-content-v24a');
  if (!content || document.getElementById('voice-mode-v24a')) return false;

  const section = document.createElement('section');
  section.id = 'voice-mode-v24a';
  section.className = 'voice-mode-v24a';
  section.innerHTML = `
    <div>
      <strong>Modo de voz</strong>
      <span>Natural usa áudio neural; Dispositivo funciona sem gerar áudio no servidor.</span>
    </div>
    <div class="voice-mode-options-v24a" role="group" aria-label="Modo de voz">
      <button type="button" data-natural-voice-mode="natural" aria-pressed="false">Natural</button>
      <button type="button" data-natural-voice-mode="device" aria-pressed="false">Dispositivo</button>
    </div>`;

  content.prepend(section);
  section.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-natural-voice-mode]')
      : null;
    if (button) setMode(button.dataset.naturalVoiceMode);
  });
  updateModeUi();
  return true;
}

function initialize() {
  if (!hasWindow || typeof document === 'undefined') return;

  const rate = document.getElementById('voice-rate-v23');
  rate?.addEventListener('input', () => setNaturalPlaybackRate(rate.value));
  rate?.addEventListener('change', () => setNaturalPlaybackRate(rate.value));

  if (!mountModeUi()) {
    const observer = new MutationObserver(() => {
      if (mountModeUi()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  player?.addEventListener('play', dispatchState);
  player?.addEventListener('pause', dispatchState);
  window.addEventListener('beforeunload', () => stopNaturalSpeech({ resume: false, announce: false }));

  window.screenAssistantNaturalVoice = Object.freeze({
    speakAnswer: speakAnswerNaturally,
    stop: stopNaturalSpeech,
    isSpeaking,
    isBusy,
    getMode,
    setMode,
    setRate: setNaturalPlaybackRate,
  });

  updateModeUi();
  dispatchState();
}

initialize();

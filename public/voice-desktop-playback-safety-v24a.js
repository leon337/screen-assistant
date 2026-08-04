import { getAccessToken, signOut } from './auth-v20.js';
import { readApiResponse } from './http.js';

const DESKTOP_QUERY = '(min-width: 901px) and (pointer: fine)';
const SAMPLE_RATE = 24000;
const SAMPLE_WIDTH = 2;
const FIRST_AUDIO_TIMEOUT_MS = 7000;
const REQUEST_TIMEOUT_MS = 20000;
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000;
const LOCAL_CHUNK_LIMIT = 650;
const PCM_SLICE_BYTES = SAMPLE_RATE * SAMPLE_WIDTH;
const MODE_KEY = 'screen-assistant-desktop-playback-mode-v24a';
const COOLDOWN_KEY = 'screen-assistant-desktop-tts-cooldown-until';
const EMPTY_ANSWERS = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
  'Iniciando análise…',
]);

const baseVoice = window.screenAssistantNaturalVoice || null;
let preferredMode = loadPreferredMode();
let audioContext = null;
let requestController = null;
let requestTimeout = null;
let firstAudioTimeout = null;
let streamGenerating = false;
let streamSpeaking = false;
let streamCompleted = false;
let nextStartTime = 0;
let carryByte = null;
let localSpeaking = false;
let localQueue = [];
let runVersion = 0;
const activeSources = new Set();

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function loadPreferredMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'device' ? 'device' : 'natural';
  } catch {
    return 'natural';
  }
}

function savePreferredMode() {
  try { localStorage.setItem(MODE_KEY, preferredMode); } catch {}
}

function cooldownUntil() {
  try { return Number(sessionStorage.getItem(COOLDOWN_KEY) || 0); } catch { return 0; }
}

function setCooldown() {
  try { sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() + QUOTA_COOLDOWN_MS)); } catch {}
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
  const busy = answer?.getAttribute('aria-busy') === 'true';
  if (busy || !text || EMPTY_ANSWERS.has(text)) return '';
  return text
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4000);
}

function currentRate() {
  const input = document.getElementById('voice-rate-v23');
  const parsed = Number(input?.value || 1);
  return Number.isFinite(parsed) ? parsed : 1;
}

function updateModeUi() {
  for (const button of document.querySelectorAll('[data-natural-voice-mode]')) {
    const active = button.dataset.naturalVoiceMode === preferredMode;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('is-active', active);
  }
  const current = document.getElementById('voice-current-v24a');
  if (current) {
    current.textContent = preferredMode === 'natural'
      ? 'Voz natural com fallback · Português (Brasil)'
      : 'Voz do computador · Português (Brasil)';
  }
}

function dispatchState() {
  document.dispatchEvent(new CustomEvent('screen-assistant-natural-voice-change', {
    detail: {
      mode: preferredMode,
      speaking: isSpeaking(),
      generating: streamGenerating,
      streaming: streamGenerating || streamSpeaking,
      preloaded: false,
      desktopSafePlayback: true,
    },
  }));
}

function clearRequestTimers() {
  clearTimeout(requestTimeout);
  clearTimeout(firstAudioTimeout);
  requestTimeout = null;
  firstAudioTimeout = null;
}

function cancelMicrophone() {
  try { window.screenAssistantDesktopVoice?.cancel?.(); } catch {}

  for (const id of ['voice-command-toggle-v23', 'voice-command-panel-toggle-v23']) {
    const toggle = document.getElementById(id);
    if (toggle?.getAttribute('aria-pressed') === 'true' && !toggle.disabled) {
      try { toggle.click(); } catch {}
    }
  }
}

function stopSources() {
  for (const source of activeSources) {
    try { source.stop(); } catch {}
  }
  activeSources.clear();
  nextStartTime = 0;
  carryByte = null;
  streamSpeaking = false;
  streamCompleted = false;
}

function stopLocalSpeech() {
  localQueue = [];
  localSpeaking = false;
  window.speechSynthesis?.cancel();
}

function stopSafePlayback({ announce = true } = {}) {
  runVersion += 1;
  requestController?.abort();
  requestController = null;
  clearRequestTimers();
  stopSources();
  stopLocalSpeech();
  streamGenerating = false;
  baseVoice?.stop?.({ resume: false, announce: false, preservePreload: false });
  if (announce) setStatus('Leitura interrompida.');
  dispatchState();
}

function ensureAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) throw new Error('Web Audio indisponível neste navegador.');
    audioContext = new AudioContextCtor({ sampleRate: SAMPLE_RATE });
  }
  return audioContext;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function normalizePcm(bytes) {
  let normalized = bytes;
  if (carryByte !== null) {
    const joined = new Uint8Array(normalized.length + 1);
    joined[0] = carryByte;
    joined.set(normalized, 1);
    normalized = joined;
    carryByte = null;
  }
  if (normalized.length % 2 === 1) {
    carryByte = normalized[normalized.length - 1];
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function yieldToBrowser() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

async function schedulePcm(base64, version) {
  let bytes = normalizePcm(base64ToBytes(base64));
  if (!bytes.length || version !== runVersion) return;

  const context = ensureAudioContext();
  clearTimeout(firstAudioTimeout);
  firstAudioTimeout = null;
  streamGenerating = false;
  streamSpeaking = true;

  for (let offset = 0; offset < bytes.length; offset += PCM_SLICE_BYTES) {
    if (version !== runVersion) return;
    const slice = bytes.subarray(offset, Math.min(bytes.length, offset + PCM_SLICE_BYTES));
    const frameCount = Math.floor(slice.length / SAMPLE_WIDTH);
    const audioBuffer = context.createBuffer(1, frameCount, SAMPLE_RATE);
    const channel = audioBuffer.getChannelData(0);
    const view = new DataView(slice.buffer, slice.byteOffset, slice.byteLength);

    for (let index = 0; index < frameCount; index += 1) {
      channel[index] = Math.max(-1, Math.min(1, view.getInt16(index * 2, true) / 32768));
    }

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = currentRate();
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.06, nextStartTime || 0);
    nextStartTime = startAt + (audioBuffer.duration / source.playbackRate.value);
    activeSources.add(source);
    source.onended = () => {
      activeSources.delete(source);
      if (streamCompleted && activeSources.size === 0 && version === runVersion) {
        streamSpeaking = false;
        nextStartTime = 0;
        setStatus('Leitura concluída.');
        dispatchState();
      }
    };
    source.start(startAt);
    await yieldToBrowser();
  }

  setStatus(`Lendo com voz natural em ${currentRate().toFixed(1)}x.`, 'success');
  dispatchState();
}

function parseSseBlock(block) {
  const data = block
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n');
  if (!data || data === '[DONE]') return null;
  try { return JSON.parse(data); } catch { return null; }
}

async function requestStream(text, signal) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw Object.assign(new Error('Entre na sua conta para usar a voz natural.'), { status: 401 });

  const response = await fetch('/api/v1/synthesize-speech-stream', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      accept: 'text/event-stream',
      'x-request-id': crypto.randomUUID(),
    },
    body: JSON.stringify({ text }),
    cache: 'no-store',
    signal,
  });

  if (!response.ok || !response.body) {
    const payload = await readApiResponse(response);
    if (response.status === 401) await signOut();
    throw Object.assign(
      new Error(payload.error?.message || 'A voz natural está indisponível.'),
      { status: response.status, code: payload.error?.code || '' },
    );
  }
  return response;
}

function splitForLocalSpeech(text) {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?;:])\s+/)
    .filter(Boolean);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > LOCAL_CHUNK_LIMIT) {
      if (current) chunks.push(current);
      for (let offset = 0; offset < sentence.length; offset += LOCAL_CHUNK_LIMIT) {
        chunks.push(sentence.slice(offset, offset + LOCAL_CHUNK_LIMIT));
      }
      current = '';
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > LOCAL_CHUNK_LIMIT) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.slice(0, LOCAL_CHUNK_LIMIT)];
}

function choosePtBrVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find((voice) => String(voice.lang || '').replace('_', '-').toLowerCase() === 'pt-br')
    || voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith('pt'))
    || null;
}

function speakNextLocal(version) {
  if (version !== runVersion) return;
  const text = localQueue.shift();
  if (!text) {
    localSpeaking = false;
    setStatus('Leitura concluída.');
    dispatchState();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = currentRate();
  const voice = choosePtBrVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => window.setTimeout(() => speakNextLocal(version), 20);
  utterance.onerror = () => {
    localQueue = [];
    localSpeaking = false;
    setStatus('O navegador não conseguiu reproduzir a voz local.', 'error');
    dispatchState();
  };
  window.speechSynthesis.speak(utterance);
}

function startLocalFallback(text, version, reason = '') {
  requestController?.abort();
  requestController = null;
  clearRequestTimers();
  streamGenerating = false;
  stopSources();

  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance !== 'function') {
    setStatus('A voz natural falhou e este navegador não oferece voz local.', 'error');
    dispatchState();
    return true;
  }

  localQueue = splitForLocalSpeech(text);
  localSpeaking = true;
  setStatus(
    reason
      ? `${reason} Usando a voz do computador.`
      : 'Usando a voz do computador.',
    'error',
  );
  dispatchState();
  speakNextLocal(version);
  return true;
}

async function playNaturalStream(text, version) {
  const context = ensureAudioContext();
  await context.resume();
  requestController = new AbortController();
  streamGenerating = true;
  streamCompleted = false;
  setStatus('Preparando voz natural…', 'success');
  dispatchState();

  requestTimeout = window.setTimeout(() => requestController?.abort(), REQUEST_TIMEOUT_MS);
  firstAudioTimeout = window.setTimeout(() => requestController?.abort(), FIRST_AUDIO_TIMEOUT_MS);

  const response = await requestStream(text, requestController.signal);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let receivedAudio = false;

  while (version === runVersion) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const event = parseSseBlock(block);
      const delta = event?.event_type === 'step.delta' ? event.delta : null;
      if (delta?.type === 'audio' && delta.data) {
        receivedAudio = true;
        await schedulePcm(delta.data, version);
      }
    }
    if (done) break;
  }

  clearRequestTimers();
  requestController = null;
  if (!receivedAudio) throw new Error('O provedor não retornou áudio.');
  streamCompleted = true;
  streamGenerating = false;
  if (activeSources.size === 0) {
    streamSpeaking = false;
    setStatus('Leitura concluída.');
  }
  dispatchState();
}

async function speakAnswerSafely() {
  const text = answerText();
  if (!text) {
    setStatus('Ainda não existe uma resposta disponível para leitura.', 'error');
    return true;
  }

  stopSafePlayback({ announce: false });
  const version = runVersion;
  cancelMicrophone();

  if (preferredMode === 'device' || Date.now() < cooldownUntil()) {
    return startLocalFallback(text, version, preferredMode === 'device'
      ? ''
      : 'A cota da voz natural está temporariamente indisponível.');
  }

  try {
    await playNaturalStream(text, version);
    return true;
  } catch (error) {
    if (version !== runVersion) return true;
    const aborted = error?.name === 'AbortError';
    const status = Number(error?.status || 0);
    if (status === 429) setCooldown();
    const reason = status === 429
      ? 'A cota da voz natural foi atingida.'
      : aborted
        ? 'A voz natural demorou além do limite.'
        : 'A voz natural não pôde ser iniciada.';
    return startLocalFallback(text, version, reason);
  }
}

function isSpeaking() {
  return streamSpeaking || localSpeaking;
}

function isBusy() {
  return streamGenerating || isSpeaking();
}

function setPreferredMode(mode) {
  preferredMode = mode === 'device' ? 'device' : 'natural';
  savePreferredMode();
  stopSafePlayback({ announce: false });
  updateModeUi();
  setStatus(preferredMode === 'natural'
    ? 'Voz natural ativada com fallback automático.'
    : 'Voz do computador ativada.', 'success');
  dispatchState();
}

function setRate(rate) {
  const value = Number(rate) || 1;
  for (const source of activeSources) source.playbackRate.value = value;
  baseVoice?.setRate?.(value);
  dispatchState();
}

function interceptModeButtons(event) {
  const button = event.target instanceof Element
    ? event.target.closest('[data-natural-voice-mode]')
    : null;
  if (!button || !isDesktop()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  setPreferredMode(button.dataset.naturalVoiceMode);
}

function initialize() {
  if (!isDesktop() || !baseVoice || window.screenAssistantDesktopPlaybackSafety) return;

  baseVoice.stop?.({ resume: false, announce: false, preservePreload: false });
  baseVoice.setMode?.('device');

  window.screenAssistantNaturalVoice = Object.freeze({
    speakAnswer: speakAnswerSafely,
    preload: () => Promise.resolve(null),
    stop: stopSafePlayback,
    isSpeaking,
    isBusy,
    isPreloaded: () => false,
    getMode: () => preferredMode,
    setMode: setPreferredMode,
    setRate,
  });
  window.screenAssistantDesktopPlaybackSafety = true;
  document.body.dataset.voiceDesktopPlayback = 'safe';
  document.addEventListener('click', interceptModeButtons, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') stopSafePlayback({ announce: false });
  });
  window.addEventListener('beforeunload', () => stopSafePlayback({ announce: false }));
  updateModeUi();
  dispatchState();
}

initialize();

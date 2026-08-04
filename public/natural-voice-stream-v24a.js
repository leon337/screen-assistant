import { getAccessToken, signOut } from './auth-v20.js';
import { readApiResponse } from './http.js';

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const SAMPLE_WIDTH = 2;
const START_BUFFER_BYTES = Math.round(SAMPLE_RATE * SAMPLE_WIDTH * 0.24);
const EMPTY_ANSWERS = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
  'Iniciando análise…',
]);

const hasWindow = typeof window !== 'undefined';
const legacy = hasWindow ? window.screenAssistantNaturalVoice : null;
let audioContext = null;
let streamController = null;
let streamGenerating = false;
let streamSpeaking = false;
let streamCompleted = false;
let nextStartTime = 0;
let pendingBytes = new Uint8Array(0);
let carryByte = null;
let commandsWereArmed = false;
const activeSources = new Set();

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

function commandToggle() {
  return document.getElementById('voice-command-panel-toggle-v23')
    || document.getElementById('voice-command-toggle-v23');
}

function pauseCommands() {
  if (commandsWereArmed) return;
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

function dispatchState() {
  document.dispatchEvent(new CustomEvent('screen-assistant-natural-voice-change', {
    detail: {
      mode: getMode(),
      speaking: isSpeaking(),
      generating: streamGenerating,
      streaming: streamSpeaking || streamGenerating,
      preloaded: legacy?.isPreloaded?.() || false,
    },
  }));
}

function ensureAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) throw new Error('Este navegador não oferece reprodução progressiva de áudio.');
    audioContext = new AudioContextCtor({ sampleRate: SAMPLE_RATE });
  }
  return audioContext;
}

function concatBytes(left, right) {
  const result = new Uint8Array(left.length + right.length);
  result.set(left, 0);
  result.set(right, left.length);
  return result;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function normalizePcmBytes(bytes) {
  let normalized = bytes;
  if (carryByte !== null) {
    normalized = concatBytes(new Uint8Array([carryByte]), normalized);
    carryByte = null;
  }
  if (normalized.length % 2 === 1) {
    carryByte = normalized[normalized.length - 1];
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function bytesToAudioBuffer(bytes) {
  const context = ensureAudioContext();
  const frameCount = Math.floor(bytes.length / SAMPLE_WIDTH);
  const audioBuffer = context.createBuffer(CHANNELS, frameCount, SAMPLE_RATE);
  const channel = audioBuffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = Math.max(-1, Math.min(1, view.getInt16(index * 2, true) / 32768));
  }
  return audioBuffer;
}

function maybeFinishStream() {
  if (!streamCompleted || activeSources.size || pendingBytes.length) return;
  streamSpeaking = false;
  streamGenerating = false;
  nextStartTime = 0;
  setStatus('Leitura natural concluída.');
  resumeCommands();
  dispatchState();
}

function scheduleBytes(bytes, { force = false } = {}) {
  const normalized = normalizePcmBytes(bytes);
  if (normalized.length) pendingBytes = concatBytes(pendingBytes, normalized);
  if (!pendingBytes.length) return;
  if (!force && !streamSpeaking && pendingBytes.length < START_BUFFER_BYTES) return;

  const context = ensureAudioContext();
  const audioBuffer = bytesToAudioBuffer(pendingBytes);
  pendingBytes = new Uint8Array(0);
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = currentRate();
  source.connect(context.destination);

  const startAt = Math.max(context.currentTime + 0.06, nextStartTime || 0);
  nextStartTime = startAt + (audioBuffer.duration / source.playbackRate.value);
  activeSources.add(source);
  source.onended = () => {
    activeSources.delete(source);
    maybeFinishStream();
  };

  if (!streamSpeaking) {
    pauseCommands();
    streamSpeaking = true;
    streamGenerating = false;
    setStatus(`Lendo com voz natural em ${source.playbackRate.value.toFixed(1)}x.`, 'success');
  }
  source.start(startAt);
  dispatchState();
}

function stopStreamOnly({ resume = true, announce = false } = {}) {
  streamController?.abort();
  streamController = null;
  for (const source of activeSources) {
    try { source.stop(); } catch {}
  }
  activeSources.clear();
  pendingBytes = new Uint8Array(0);
  carryByte = null;
  streamGenerating = false;
  streamSpeaking = false;
  streamCompleted = false;
  nextStartTime = 0;
  if (resume) resumeCommands();
  if (announce) setStatus('Leitura interrompida.');
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
  if (!accessToken) throw new Error('Entre na sua conta para usar a voz natural.');

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
    throw new Error(payload.error?.message || 'Não foi possível iniciar a voz natural progressiva.');
  }
  return response;
}

async function playStream(text) {
  const context = ensureAudioContext();
  await context.resume();
  streamController = new AbortController();
  streamGenerating = true;
  streamCompleted = false;
  setStatus('Iniciando voz natural progressiva…', 'success');
  dispatchState();

  const response = await requestStream(text, streamController.signal);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let receivedAudio = false;

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const event = parseSseBlock(block);
      const delta = event?.event_type === 'step.delta' ? event.delta : null;
      if (delta?.type === 'audio' && delta.data) {
        receivedAudio = true;
        scheduleBytes(base64ToBytes(delta.data));
      }
    }
    if (done) break;
  }

  if (buffer.trim()) {
    const event = parseSseBlock(buffer);
    const delta = event?.event_type === 'step.delta' ? event.delta : null;
    if (delta?.type === 'audio' && delta.data) {
      receivedAudio = true;
      scheduleBytes(base64ToBytes(delta.data));
    }
  }

  if (!receivedAudio) throw new Error('O provedor não retornou áudio progressivo.');
  carryByte = null;
  scheduleBytes(new Uint8Array(0), { force: true });
  streamCompleted = true;
  streamController = null;
  maybeFinishStream();
}

export async function speakAnswerStreamed() {
  if (getMode() !== 'natural') return legacy?.speakAnswer?.() ?? false;
  if (legacy?.isPreloaded?.()) return legacy.speakAnswer();

  const text = answerText();
  if (!text) {
    setStatus('Ainda não existe uma resposta disponível para leitura.', 'error');
    return true;
  }

  stopStreamOnly({ resume: false });
  legacy?.stop?.({ resume: false, announce: false, preservePreload: false });
  window.speechSynthesis?.cancel();

  try {
    await playStream(text);
    return true;
  } catch (error) {
    const cancelled = error?.name === 'AbortError';
    stopStreamOnly({ resume: true });
    if (cancelled) {
      setStatus('Geração da voz cancelada.');
      return true;
    }
    console.warn('Streaming TTS indisponível; usando geração completa.', error);
    setStatus('Streaming indisponível. Tentando a voz natural completa…', 'error');
    return legacy?.speakAnswer?.() ?? false;
  }
}

export function stopNaturalSpeechStreamed(options = {}) {
  stopStreamOnly({ resume: options.resume !== false, announce: options.announce !== false });
  legacy?.stop?.(options);
}

export function isSpeaking() {
  return streamSpeaking || Boolean(legacy?.isSpeaking?.());
}

export function isBusy() {
  return streamGenerating || streamSpeaking || Boolean(legacy?.isBusy?.());
}

export function getMode() {
  return legacy?.getMode?.() || 'natural';
}

export function setNaturalPlaybackRate(rate) {
  const value = Number(rate) || 1;
  for (const source of activeSources) source.playbackRate.value = value;
  legacy?.setRate?.(value);
  dispatchState();
}

function initialize() {
  if (!hasWindow || !legacy || window.screenAssistantNaturalVoiceStreaming) return;

  window.screenAssistantNaturalVoice = Object.freeze({
    speakAnswer: speakAnswerStreamed,
    preload: (...args) => legacy.preload?.(...args),
    stop: stopNaturalSpeechStreamed,
    isSpeaking,
    isBusy,
    isPreloaded: () => legacy.isPreloaded?.() || false,
    getMode,
    setMode: (...args) => legacy.setMode?.(...args),
    setRate: setNaturalPlaybackRate,
  });
  window.screenAssistantNaturalVoiceStreaming = true;
  document.body.dataset.voiceStreaming = 'ready';
  window.addEventListener('beforeunload', () => stopStreamOnly({ resume: false }));
  dispatchState();
}

initialize();

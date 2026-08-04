import { getAccessToken, signOut } from './auth-v20.js';
import { readApiResponse } from './http.js';

const DESKTOP_QUERY = '(min-width: 901px) and (pointer: fine)';
const MAX_RECORDING_MS = 5000;
const STOP_WATCHDOG_MS = 1500;
const TRANSCRIPTION_TIMEOUT_MS = 12000;

const legacyDesktopVoice = window.screenAssistantDesktopVoice || null;
let micButton = null;
let recorder = null;
let microphoneStream = null;
let chunks = [];
let recordingTimer = null;
let stopWatchdog = null;
let transcriptionController = null;
let sessionVersion = 0;
let state = 'idle';

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function commandStatus() {
  return document.getElementById('voice-command-status-v23');
}

function setStatus(message, tone = 'neutral') {
  const status = commandStatus();
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function stopTracks() {
  microphoneStream?.getTracks().forEach((track) => {
    try { track.stop(); } catch {}
  });
  microphoneStream = null;
}

function clearTimers() {
  clearTimeout(recordingTimer);
  clearTimeout(stopWatchdog);
  recordingTimer = null;
  stopWatchdog = null;
}

function buttonLabel() {
  if (state === 'requesting') return 'Liberando…';
  if (state === 'recording') return 'Ouvindo…';
  if (state === 'processing') return 'Entendendo…';
  return 'Mic';
}

function synchronizeButton() {
  if (!micButton) return;
  const pressed = state === 'recording';
  const disabled = state === 'requesting' || state === 'processing';
  const label = micButton.querySelector('[data-label]');
  const desiredPressed = String(pressed);
  const desiredLabel = buttonLabel();

  if (micButton.getAttribute('aria-pressed') !== desiredPressed) {
    micButton.setAttribute('aria-pressed', desiredPressed);
  }
  if (micButton.disabled !== disabled) micButton.disabled = disabled;
  micButton.classList.toggle('is-active', pressed || state === 'processing');
  if (label && label.textContent !== desiredLabel) label.textContent = desiredLabel;
  micButton.setAttribute('aria-label', pressed ? 'Parar gravação do comando' : 'Gravar comando curto');
  document.body.dataset.voiceDesktopStable = state;
}

function setState(nextState) {
  if (state === nextState) return;
  state = nextState;
  synchronizeButton();
}

function disarmLegacyRecognition() {
  const toggles = [
    document.getElementById('voice-command-toggle-v23'),
    document.getElementById('voice-command-panel-toggle-v23'),
  ].filter(Boolean);

  const active = toggles.find((toggle) => toggle.getAttribute('aria-pressed') === 'true');
  if (active && !active.disabled) {
    try { active.click(); } catch {}
  }

  for (const toggle of toggles) {
    toggle.hidden = true;
    toggle.disabled = true;
    if (toggle.getAttribute('aria-pressed') !== 'false') {
      toggle.setAttribute('aria-pressed', 'false');
    }
  }
}

function chooseMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
}

function resetToIdle({ message = '', tone = 'neutral', invalidate = false } = {}) {
  if (invalidate) sessionVersion += 1;
  clearTimers();
  transcriptionController?.abort();
  transcriptionController = null;
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop(); } catch {}
  }
  recorder = null;
  chunks = [];
  stopTracks();
  setState('idle');
  if (message) setStatus(message, tone);
}

function stopRecording() {
  if (state !== 'recording') return;
  clearTimeout(recordingTimer);
  recordingTimer = null;

  const activeRecorder = recorder;
  if (!activeRecorder || activeRecorder.state === 'inactive') {
    resetToIdle({ message: 'A gravação foi encerrada.', tone: 'neutral' });
    return;
  }

  try {
    if (typeof activeRecorder.requestData === 'function') activeRecorder.requestData();
    activeRecorder.stop();
  } catch {
    resetToIdle({
      message: 'O microfone foi reiniciado após uma falha de gravação.',
      tone: 'error',
      invalidate: true,
    });
    return;
  }

  const expectedVersion = sessionVersion;
  stopWatchdog = window.setTimeout(() => {
    if (sessionVersion !== expectedVersion || state !== 'recording') return;
    resetToIdle({
      message: 'O microfone demorou para encerrar e foi reiniciado automaticamente.',
      tone: 'error',
      invalidate: true,
    });
  }, STOP_WATCHDOG_MS);
}

async function dispatchCommand(transcript) {
  const execute = legacyDesktopVoice?.executeCommand;
  if (typeof execute !== 'function') {
    setStatus(`Ouvi “${transcript}”, mas o executor de comandos não está disponível.`, 'error');
    return;
  }

  try {
    await Promise.resolve(execute(transcript));
  } catch (error) {
    console.error('Falha ao executar comando de voz desktop.', error);
    setStatus('O comando foi reconhecido, mas não pôde ser executado.', 'error');
  }
}

async function transcribe(blob, version) {
  setState('processing');
  setStatus('Entendendo o comando…', 'success');
  transcriptionController = new AbortController();
  const timeout = window.setTimeout(() => transcriptionController?.abort(), TRANSCRIPTION_TIMEOUT_MS);

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error('Entre na sua conta para usar comandos de voz.');

    const extension = blob.type.includes('ogg')
      ? 'ogg'
      : blob.type.includes('mp4')
        ? 'm4a'
        : 'webm';
    const formData = new FormData();
    formData.append('audio', blob, `comando.${extension}`);

    const response = await fetch('/api/v1/transcribe-command', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-request-id': crypto.randomUUID(),
      },
      body: formData,
      cache: 'no-store',
      signal: transcriptionController.signal,
    });
    const payload = await readApiResponse(response);
    if (!response.ok) {
      if (response.status === 401) await signOut();
      throw new Error(payload.error?.message || 'Não foi possível reconhecer o comando.');
    }

    if (version !== sessionVersion) return;
    const transcript = String(payload.data?.transcript || '').trim();
    setState('idle');
    transcriptionController = null;

    if (!transcript) {
      setStatus('Nenhuma fala foi identificada. Tente novamente.', 'error');
      return;
    }

    setStatus(`Ouvi: “${transcript}”.`, 'success');
    queueMicrotask(() => dispatchCommand(transcript));
  } catch (error) {
    if (version !== sessionVersion) return;
    const timedOut = error?.name === 'AbortError';
    setState('idle');
    transcriptionController = null;
    setStatus(timedOut
      ? 'A transcrição demorou demais e foi cancelada. Tente novamente.'
      : error?.message || 'Não foi possível reconhecer o comando.', 'error');
  } finally {
    clearTimeout(timeout);
    if (version === sessionVersion && state === 'processing') setState('idle');
  }
}

async function startRecording() {
  if (!isDesktop() || state !== 'idle') return;
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder !== 'function') {
    setStatus('Este navegador não oferece gravação de microfone compatível.', 'error');
    return;
  }

  disarmLegacyRecognition();
  const version = ++sessionVersion;
  setState('requesting');
  setStatus('Solicitando acesso ao microfone…', 'success');

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    if (version !== sessionVersion) {
      stopTracks();
      return;
    }

    chunks = [];
    const mimeType = chooseMimeType();
    recorder = new MediaRecorder(microphoneStream, mimeType ? { mimeType } : undefined);

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) chunks.push(event.data);
    });

    recorder.addEventListener('error', () => {
      if (version !== sessionVersion) return;
      resetToIdle({
        message: 'A gravação apresentou uma falha e foi encerrada.',
        tone: 'error',
        invalidate: true,
      });
    }, { once: true });

    recorder.addEventListener('stop', () => {
      if (version !== sessionVersion) return;
      clearTimeout(stopWatchdog);
      stopWatchdog = null;
      stopTracks();
      const type = recorder?.mimeType || chunks[0]?.type || 'audio/webm';
      const blob = new Blob(chunks, { type: type.split(';')[0] });
      recorder = null;
      chunks = [];

      if (blob.size < 256) {
        setState('idle');
        setStatus('Nenhuma fala foi detectada.', 'error');
        return;
      }
      void transcribe(blob, version);
    }, { once: true });

    recorder.start(250);
    setState('recording');
    setStatus('Fale um comando curto. A gravação termina automaticamente.', 'success');
    recordingTimer = window.setTimeout(stopRecording, MAX_RECORDING_MS);
  } catch (error) {
    if (version !== sessionVersion) return;
    stopTracks();
    setState('idle');
    const denied = ['NotAllowedError', 'SecurityError'].includes(error?.name);
    setStatus(denied
      ? 'O navegador bloqueou o microfone. Libere a permissão deste site.'
      : 'Não foi possível abrir o microfone do computador.', 'error');
  }
}

function toggleRecording() {
  if (state === 'recording') stopRecording();
  else if (state === 'idle') void startRecording();
}

function installStableButton() {
  if (!isDesktop()) return false;
  const currentButton = document.getElementById('voice-mic-v24a');
  if (!currentButton) return false;
  if (currentButton.dataset.stableDesktopVoice === 'true') {
    micButton = currentButton;
    synchronizeButton();
    return true;
  }

  const replacement = currentButton.cloneNode(true);
  replacement.dataset.stableDesktopVoice = 'true';
  currentButton.replaceWith(replacement);
  micButton = replacement;
  micButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleRecording();
  }, true);
  synchronizeButton();
  disarmLegacyRecognition();
  return true;
}

function initialize() {
  if (!isDesktop()) return;
  if (!installStableButton()) {
    const observer = new MutationObserver(() => {
      if (!installStableButton()) return;
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.screenAssistantDesktopVoice = Object.freeze({
    executeCommand: (...args) => legacyDesktopVoice?.executeCommand?.(...args),
    start: startRecording,
    stop: stopRecording,
    cancel: () => resetToIdle({ invalidate: true }),
    isRecording: () => state === 'recording',
    isProcessing: () => state === 'processing',
    state: () => state,
  });

  document.body.dataset.voiceDesktopStability = 'ready';
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' && state !== 'idle') {
      resetToIdle({ invalidate: true });
    }
  });
  window.addEventListener('beforeunload', () => resetToIdle({ invalidate: true }));
}

initialize();

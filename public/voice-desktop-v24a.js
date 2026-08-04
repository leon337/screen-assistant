import { getAccessToken, signOut } from './auth-v20.js';
import { readApiResponse } from './http.js';

const DESKTOP_QUERY = '(min-width: 901px) and (pointer: fine)';
const MAX_RECORDING_MS = 6000;
const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition || null;

let recorder = null;
let microphoneStream = null;
let chunks = [];
let stopTimer = null;
let recording = false;
let processing = false;
let micButton = null;
let buttonObserver = null;

function commandStatus() {
  return document.getElementById('voice-command-status-v23');
}

function setStatus(message, tone = 'neutral') {
  const status = commandStatus();
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function shouldUseFallback() {
  return window.matchMedia(DESKTOP_QUERY).matches || !SpeechRecognitionApi;
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:ei\s+)?(?:screen\s+assistente|screen\s+assistant|assistente|screen)\s*/, '')
    .trim();
}

function setMicVisual() {
  if (!micButton) return;
  const active = recording || processing;
  const label = micButton.querySelector('[data-label]');
  const desired = recording ? 'Ouvindo…' : processing ? 'Entendendo…' : 'Mic';
  if (micButton.getAttribute('aria-pressed') !== String(active)) {
    micButton.setAttribute('aria-pressed', String(active));
  }
  micButton.classList.toggle('is-active', active);
  micButton.disabled = processing;
  if (label && label.textContent !== desired) label.textContent = desired;
  document.body.dataset.voiceDesktopFallback = recording
    ? 'recording'
    : processing
      ? 'processing'
      : 'ready';
}

function stopTracks() {
  microphoneStream?.getTracks().forEach((track) => track.stop());
  microphoneStream = null;
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

function answerReady() {
  const answer = document.getElementById('answer');
  const text = answer?.textContent?.trim() || '';
  return Boolean(text && answer?.getAttribute('aria-busy') !== 'true');
}

async function toggleReading() {
  const natural = window.screenAssistantNaturalVoice;
  if (!answerReady()) {
    setStatus('Ainda não existe uma resposta disponível para leitura.', 'error');
    return true;
  }
  if (natural?.isBusy?.() || natural?.isSpeaking?.()) {
    natural.stop?.();
    setStatus('Leitura interrompida.');
    return true;
  }
  if (natural?.speakAnswer) {
    await natural.speakAnswer();
    return true;
  }
  document.getElementById('speak-answer')?.click();
  return true;
}

function stopReading() {
  window.screenAssistantNaturalVoice?.stop?.();
  window.speechSynthesis?.cancel();
  setStatus('Leitura interrompida.');
  return true;
}

function setRate(mode) {
  const input = document.getElementById('voice-rate-v23');
  if (!input) return false;
  const current = Number(input.value || 1);
  const next = mode === 'normal'
    ? 1
    : Math.min(1.6, Math.max(0.6, current + (mode === 'faster' ? 0.1 : -0.1)));
  input.value = next.toFixed(1);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  window.screenAssistantNaturalVoice?.setRate?.(next);
  setStatus(`Velocidade ajustada para ${next.toFixed(1)}x.`, 'success');
  return true;
}

function clickAction(ids, success, unavailable) {
  for (const id of ids) {
    const button = document.getElementById(id);
    if (button && !button.disabled) {
      button.click();
      setStatus(success, 'success');
      return true;
    }
  }
  setStatus(unavailable, 'error');
  return false;
}

async function executeCommand(rawCommand) {
  const command = normalize(rawCommand);
  if (!command) {
    setStatus('Não consegui identificar o comando. Tente dizer apenas “ler”, “parar” ou “analisar”.', 'error');
    return false;
  }

  if (/^(ler|ouvir)( resposta)?$/.test(command)) return toggleReading();
  if (/^(parar|pare|interromper)( voz| leitura)?$/.test(command)) return stopReading();
  if (/^(rapido|mais rapido|acelerar)$/.test(command)) return setRate('faster');
  if (/^(devagar|mais devagar|lento|mais lento)$/.test(command)) return setRate('slower');
  if (/^(normal|velocidade normal|voz normal)$/.test(command)) return setRate('normal');
  if (/^(analisar|analise|analisar imagem)$/.test(command)) {
    return clickAction(['analyze', 'bar-analyze'], 'Análise iniciada.', 'Selecione uma imagem e um objetivo antes de analisar.');
  }
  if (/^(novo|nova|nova analise|outra imagem)$/.test(command)) {
    return clickAction(['new-analysis'], 'Nova análise iniciada.', 'A opção Nova análise não está disponível agora.');
  }
  if (/^(repetir|repetir analise|analisar novamente)$/.test(command)) {
    return clickAction(['repeat-analysis'], 'Análise repetida.', 'Não existe uma análise pronta para repetir.');
  }
  if (/^(ajuda|comandos|o que posso falar)$/.test(command)) {
    setStatus('Diga: ler, parar, analisar, novo, repetir, rápido, devagar ou normal.', 'success');
    return true;
  }

  setStatus(`Comando não reconhecido: “${rawCommand.trim()}”. Use apenas uma palavra, como “ler” ou “analisar”.`, 'error');
  return false;
}

async function sendRecording(blob) {
  processing = true;
  setMicVisual();
  setStatus('Entendendo o comando…', 'success');

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error('Entre na sua conta para usar comandos de voz.');

    const formData = new FormData();
    formData.append('audio', blob, `comando.${blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm'}`);

    const response = await fetch('/api/v1/transcribe-command', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-request-id': crypto.randomUUID(),
      },
      body: formData,
      cache: 'no-store',
    });
    const payload = await readApiResponse(response);
    if (!response.ok) {
      if (response.status === 401) await signOut();
      throw new Error(payload.error?.message || 'Não foi possível reconhecer o comando.');
    }

    const transcript = payload.data?.transcript || '';
    setStatus(`Ouvi: “${transcript}”.`, 'success');
    await executeCommand(transcript);
  } catch (error) {
    setStatus(error?.message || 'Não foi possível reconhecer o comando.', 'error');
  } finally {
    processing = false;
    setMicVisual();
  }
}

function stopRecording() {
  clearTimeout(stopTimer);
  stopTimer = null;
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder !== 'function') {
    setStatus('Este navegador não oferece gravação de microfone compatível.', 'error');
    return;
  }

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });
    chunks = [];
    const mimeType = chooseMimeType();
    recorder = new MediaRecorder(microphoneStream, mimeType ? { mimeType } : undefined);

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) chunks.push(event.data);
    });
    recorder.addEventListener('stop', async () => {
      recording = false;
      stopTracks();
      setMicVisual();
      const type = recorder?.mimeType || chunks[0]?.type || 'audio/webm';
      const blob = new Blob(chunks, { type: type.split(';')[0] });
      chunks = [];
      recorder = null;
      if (blob.size < 256) {
        setStatus('Nenhuma fala foi detectada.', 'error');
        return;
      }
      await sendRecording(blob);
    }, { once: true });

    recorder.start(250);
    recording = true;
    setMicVisual();
    setStatus('Fale um comando curto: ler, parar, analisar, novo, repetir, rápido ou devagar.', 'success');
    stopTimer = window.setTimeout(stopRecording, MAX_RECORDING_MS);
  } catch (error) {
    recording = false;
    stopTracks();
    setMicVisual();
    const denied = ['NotAllowedError', 'SecurityError'].includes(error?.name);
    setStatus(denied
      ? 'O navegador bloqueou o microfone. Libere a permissão do site.'
      : 'Não foi possível abrir o microfone do computador.', 'error');
  }
}

function toggleRecording() {
  if (processing) return;
  if (recording) stopRecording();
  else startRecording();
}

function simplifyHelp() {
  const card = document.querySelector('.voice-command-card-v23');
  if (!card) return;
  const description = card.querySelector('div span');
  if (description) description.textContent = 'No computador, clique em Mic e diga apenas um comando curto. Não precisa falar “Screen Assistente”.';
  const help = card.querySelector('.voice-command-help-v23 ul');
  if (help) {
    help.innerHTML = [
      'Ler',
      'Parar',
      'Analisar',
      'Novo',
      'Repetir',
      'Rápido',
      'Devagar',
      'Normal',
    ].map((command) => `<li>${command}</li>`).join('');
  }
  const legacyToggle = document.getElementById('voice-command-panel-toggle-v23');
  if (shouldUseFallback() && legacyToggle) {
    legacyToggle.hidden = true;
    legacyToggle.disabled = true;
  }
}

function initialize() {
  micButton = document.getElementById('voice-mic-v24a');
  if (!micButton) return;

  micButton.addEventListener('click', (event) => {
    if (!shouldUseFallback()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleRecording();
  }, true);

  buttonObserver = new MutationObserver(() => {
    if (recording || processing) setMicVisual();
  });
  buttonObserver.observe(micButton, { attributes: true, childList: true, subtree: true });

  simplifyHelp();
  setMicVisual();
  window.matchMedia(DESKTOP_QUERY).addEventListener('change', () => {
    if (recording) stopRecording();
    simplifyHelp();
    setMicVisual();
  });

  window.screenAssistantDesktopVoice = Object.freeze({
    executeCommand,
    start: startRecording,
    stop: stopRecording,
    isRecording: () => recording,
    isProcessing: () => processing,
  });

  window.addEventListener('beforeunload', () => {
    clearTimeout(stopTimer);
    recorder?.state !== 'inactive' && recorder?.stop();
    stopTracks();
    buttonObserver?.disconnect();
  });
}

initialize();

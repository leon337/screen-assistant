import { renderMarkdown, markdownToPlainText } from '/markdown.js';
import { compressImageFile, formatBytes } from '/image.js';
import { ANALYSIS_STAGES, requestAnalysis } from '/analysis.js';
import { answerToShareText, renderStructuredAnswer } from '/response.js';
import { setupPwa } from '/pwa.js';

const $ = (id) => document.getElementById(id);
const elements = {
  status: $('status'), placeholder: $('screen-placeholder'), video: $('screen-video'),
  preview: $('image-preview'), imageMeta: $('image-meta'), sourceMeta: $('source-meta'),
  question: $('question'), answer: $('answer'), responseMeta: $('response-meta'), responsePanel: $('response-panel'),
  screenPanel: $('screen-panel'), imagePanel: $('image-panel'), share: $('share-screen'), capture: $('capture-frame'), stop: $('stop-screen'),
  camera: $('open-camera'), gallery: $('open-gallery'), cameraInput: $('camera-input'), galleryInput: $('gallery-input'),
  analyze: $('analyze'), cancelAnalysis: $('cancel-analysis'), progress: $('analysis-progress'),
  copy: $('copy-answer'), speak: $('speak-answer'), stopVoice: $('stop-voice'),
  newAnalysis: $('new-analysis'), changeImage: $('change-image'), repeatAnalysis: $('repeat-analysis'), shareAnswer: $('share-answer'), clearAll: $('clear-all'),
  layoutToggle: $('layout-toggle'), installApp: $('install-app'), installHint: $('install-hint'),
  barCamera: $('bar-camera'), barGallery: $('bar-gallery'), barAnalyze: $('bar-analyze'),
};

let screenStream = null;
let imageBlob = null;
let imageObjectUrl = null;
let rawAnswer = '';
let preparingImage = false;
let analysisController = null;
let currentStage = null;

const coarsePointer = window.matchMedia('(pointer: coarse)');
const narrowViewport = window.matchMedia('(max-width: 800px)');
const storedLayout = localStorage.getItem('screen-assistant-layout');
let compactLayout = storedLayout ? storedLayout === 'compact' : (coarsePointer.matches || narrowViewport.matches);

function applyLayout() {
  document.body.dataset.layout = compactLayout ? 'compact' : 'desktop';
  document.body.classList.toggle('has-mobile-bar', compactLayout);
  elements.layoutToggle.textContent = compactLayout ? 'Modo desktop' : 'Modo compacto';
  if (compactLayout && !screenStream) elements.screenPanel.open = false;
  if (!compactLayout) elements.screenPanel.open = true;
  if (rawAnswer) elements.answer.innerHTML = renderStructuredAnswer(rawAnswer, { compact: compactLayout });
}

function setStatus(message, tone = 'neutral') {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}

function setAnswer(text, { markdown = false, busy = false } = {}) {
  rawAnswer = String(text ?? '');
  elements.answer.setAttribute('aria-busy', String(busy));
  elements.answer.classList.toggle('loading', busy);
  elements.answer.innerHTML = markdown
    ? renderStructuredAnswer(rawAnswer, { compact: compactLayout })
    : renderMarkdown(rawAnswer);
}

function setProgress(stage = null) {
  currentStage = stage;
  const activeIndex = stage ? ANALYSIS_STAGES.indexOf(stage) : -1;
  elements.progress.classList.toggle('hidden', !stage);
  for (const item of elements.progress.querySelectorAll('[data-stage]')) {
    const index = ANALYSIS_STAGES.indexOf(item.dataset.stage);
    item.classList.toggle('active', index === activeIndex);
    item.classList.toggle('done', activeIndex > index);
  }
}

function isBusy() { return Boolean(analysisController); }

function updateControls() {
  const sharing = Boolean(screenStream);
  const busy = isBusy();
  elements.capture.disabled = !sharing || preparingImage || busy;
  elements.stop.disabled = !sharing;
  elements.analyze.disabled = !imageBlob || preparingImage || busy;
  elements.barAnalyze.disabled = elements.analyze.disabled;
  elements.camera.disabled = preparingImage || busy;
  elements.gallery.disabled = preparingImage || busy;
  elements.barCamera.disabled = elements.camera.disabled;
  elements.barGallery.disabled = elements.gallery.disabled;
  elements.cancelAnalysis.classList.toggle('hidden', !busy);
  elements.repeatAnalysis.disabled = !imageBlob || busy;
}

function resetResponse({ keepMessage = false } = {}) {
  rawAnswer = '';
  elements.copy.disabled = true;
  elements.speak.disabled = true;
  elements.stopVoice.disabled = true;
  elements.shareAnswer.disabled = true;
  elements.responseMeta.textContent = '';
  if (!keepMessage) setAnswer('Aguardando análise.');
}

function clearImage() {
  imageBlob = null;
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  imageObjectUrl = null;
  elements.preview.removeAttribute('src');
  elements.preview.classList.add('hidden');
  elements.sourceMeta.textContent = 'Nenhuma imagem selecionada.';
  elements.imageMeta.textContent = 'Use uma captura, a câmera ou a galeria.';
  updateControls();
}

function stopScreenShare() {
  screenStream?.getTracks().forEach((track) => track.stop());
  screenStream = null;
  elements.video.srcObject = null;
  elements.video.classList.add('hidden');
  elements.placeholder.classList.remove('hidden');
  setStatus('Compartilhamento encerrado. Você ainda pode usar a última imagem capturada.');
  updateControls();
}

function installImage(blob, { width, height, source, originalBytes = null } = {}) {
  imageBlob = blob;
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  imageObjectUrl = URL.createObjectURL(blob);
  elements.preview.src = imageObjectUrl;
  elements.preview.classList.remove('hidden');
  const compression = originalBytes && originalBytes !== blob.size ? ` · original ${formatBytes(originalBytes)}` : '';
  elements.imageMeta.textContent = `${width} × ${height} · ${formatBytes(blob.size)} · ${blob.type}${compression}`;
  elements.sourceMeta.textContent = `Origem: ${source}`;
  resetResponse();
  updateControls();
}

async function prepareSelectedFile(file, source) {
  if (!file) return;
  preparingImage = true;
  updateControls();
  setStatus(`Preparando imagem da ${source.toLowerCase()}…`);
  try {
    const result = await compressImageFile(file, { maxDimension: 1600, maxBytes: 2 * 1024 * 1024 });
    installImage(result.blob, { width: result.width, height: result.height, source, originalBytes: result.originalBytes });
    setStatus(`Imagem da ${source.toLowerCase()} pronta para análise.`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Não foi possível preparar a imagem.', 'error');
  } finally {
    preparingImage = false;
    elements.cameraInput.value = '';
    elements.galleryInput.value = '';
    updateControls();
  }
}

async function analyzeCurrentImage() {
  if (!imageBlob || isBusy()) return;
  analysisController = new AbortController();
  const controller = analysisController;
  const timeout = setTimeout(() => controller.abort('timeout'), 22000);
  elements.copy.disabled = true;
  elements.speak.disabled = true;
  elements.shareAnswer.disabled = true;
  setAnswer('Iniciando análise…', { busy: true });
  setProgress('prepare');
  updateControls();
  elements.responsePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const payload = await requestAnalysis({
      imageBlob,
      question: elements.question.value,
      signal: controller.signal,
      onStage: (stage) => {
        setProgress(stage);
        const messages = {
          prepare: 'Preparando imagem…', send: 'Enviando imagem com segurança…',
          analyze: 'Analisando com Gemini…', fallback: 'Tentando modelo alternativo…', format: 'Organizando resposta…',
        };
        setAnswer(messages[stage] || 'Analisando…', { busy: true });
      },
    });
    rawAnswer = payload.data.answer;
    elements.answer.innerHTML = renderStructuredAnswer(rawAnswer, { compact: compactLayout });
    elements.answer.setAttribute('aria-busy', 'false');
    elements.answer.classList.remove('loading');
    elements.responseMeta.textContent = `Modelo: ${payload.data.model}${payload.data.fallback?.used ? ' · fallback usado' : ''} · Request ID: ${payload.data.requestId}`;
    elements.copy.disabled = false;
    elements.speak.disabled = false;
    elements.shareAnswer.disabled = false;
    setStatus('Análise concluída.', 'success');
  } catch (error) {
    const aborted = controller.signal.aborted;
    const timedOut = aborted && controller.signal.reason === 'timeout';
    const message = timedOut
      ? 'A análise ultrapassou o tempo limite. Tente novamente.'
      : aborted ? 'Análise cancelada.'
        : error instanceof Error ? error.message : 'Falha inesperada.';
    setAnswer(message);
    elements.responseMeta.textContent = '';
    setStatus(message, aborted && !timedOut ? 'neutral' : 'error');
  } finally {
    clearTimeout(timeout);
    if (analysisController === controller) analysisController = null;
    setProgress(null);
    elements.answer.setAttribute('aria-busy', 'false');
    elements.answer.classList.remove('loading');
    updateControls();
  }
}

if (!navigator.mediaDevices?.getDisplayMedia) {
  elements.share.disabled = true;
  elements.share.title = 'O compartilhamento de tela não está disponível neste navegador. Use câmera ou galeria.';
  setStatus('Neste dispositivo, use Tirar foto ou Escolher imagem.');
}

elements.layoutToggle.addEventListener('click', () => {
  compactLayout = !compactLayout;
  localStorage.setItem('screen-assistant-layout', compactLayout ? 'compact' : 'desktop');
  applyLayout();
});

elements.share.addEventListener('click', async () => {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    elements.screenPanel.open = true;
    elements.video.srcObject = screenStream;
    elements.video.classList.remove('hidden');
    elements.placeholder.classList.add('hidden');
    screenStream.getVideoTracks()[0]?.addEventListener('ended', stopScreenShare, { once: true });
    setStatus('Compartilhamento ativo. Capture um frame quando estiver pronto.');
    updateControls();
  } catch {
    setStatus('Compartilhamento cancelado ou não autorizado.');
  }
});

elements.stop.addEventListener('click', stopScreenShare);
elements.capture.addEventListener('click', async () => {
  const width = elements.video.videoWidth;
  const height = elements.video.videoHeight;
  if (!width || !height) return setStatus('A tela compartilhada ainda não está pronta para captura.', 'error');
  const scale = Math.min(1, 1280 / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth; canvas.height = targetHeight;
  canvas.getContext('2d')?.drawImage(elements.video, 0, 0, targetWidth, targetHeight);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.75));
  if (!blob) return setStatus('Não foi possível gerar a captura.', 'error');
  installImage(blob, { width: targetWidth, height: targetHeight, source: 'Captura de tela' });
  setStatus('Frame capturado e pronto para análise.', 'success');
});

const openCamera = () => elements.cameraInput.click();
const openGallery = () => elements.galleryInput.click();
elements.camera.addEventListener('click', openCamera);
elements.gallery.addEventListener('click', openGallery);
elements.barCamera.addEventListener('click', openCamera);
elements.barGallery.addEventListener('click', openGallery);
elements.cameraInput.addEventListener('change', () => prepareSelectedFile(elements.cameraInput.files?.[0], 'Câmera'));
elements.galleryInput.addEventListener('change', () => prepareSelectedFile(elements.galleryInput.files?.[0], 'Galeria'));

elements.analyze.addEventListener('click', analyzeCurrentImage);
elements.barAnalyze.addEventListener('click', analyzeCurrentImage);
elements.repeatAnalysis.addEventListener('click', analyzeCurrentImage);
elements.cancelAnalysis.addEventListener('click', () => analysisController?.abort('user'));

elements.newAnalysis.addEventListener('click', () => {
  elements.question.value = '';
  resetResponse();
  elements.imagePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus(imageBlob ? 'Pronto para uma nova pergunta sobre a imagem atual.' : 'Escolha uma imagem para iniciar.');
});

elements.changeImage.addEventListener('click', () => {
  elements.imagePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  openGallery();
});

elements.clearAll.addEventListener('click', () => {
  analysisController?.abort('user');
  stopScreenShare();
  clearImage();
  elements.question.value = '';
  resetResponse();
  speechSynthesis.cancel();
  setStatus('Tudo foi limpo.');
});

elements.copy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(markdownToPlainText(rawAnswer));
  setStatus('Resposta copiada sem marcações Markdown.', 'success');
});

elements.shareAnswer.addEventListener('click', async () => {
  const text = answerToShareText(rawAnswer);
  try {
    if (navigator.share) await navigator.share({ title: 'Análise do Screen Assistant', text });
    else {
      await navigator.clipboard.writeText(text);
      setStatus('Compartilhamento não disponível; resposta copiada.', 'success');
    }
  } catch (error) {
    if (error?.name !== 'AbortError') setStatus('Não foi possível compartilhar a resposta.', 'error');
  }
});

elements.speak.addEventListener('click', () => {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(markdownToPlainText(rawAnswer));
  utterance.lang = 'pt-BR';
  elements.stopVoice.disabled = false;
  utterance.onend = () => { elements.stopVoice.disabled = true; };
  utterance.onerror = () => { elements.stopVoice.disabled = true; };
  speechSynthesis.speak(utterance);
});
elements.stopVoice.addEventListener('click', () => { speechSynthesis.cancel(); elements.stopVoice.disabled = true; });

setupPwa({ installButton: elements.installApp, hintElement: elements.installHint, onStatus: setStatus });
window.addEventListener('beforeunload', () => {
  screenStream?.getTracks().forEach((track) => track.stop());
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  analysisController?.abort('unload');
  speechSynthesis.cancel();
});

applyLayout();
updateControls();

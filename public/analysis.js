import { readApiResponse } from './http.js';
import { getAnalysisContext } from './intent-v19.js';

export const ANALYSIS_STAGES = ['prepare', 'send', 'analyze', 'fallback', 'format'];

function getAccessToken() {
  const stored = sessionStorage.getItem('screen-assistant-access-token')?.trim();
  if (stored) return stored;

  const supplied = window.prompt('Digite o código de acesso do piloto fechado:')?.trim() || '';
  if (!supplied) throw new Error('Código de acesso obrigatório para este piloto.');
  sessionStorage.setItem('screen-assistant-access-token', supplied);
  return supplied;
}

function confirmPrivacyOnce() {
  if (sessionStorage.getItem('screen-assistant-privacy-confirmed') === 'yes') return;
  const accepted = window.confirm(
    'A imagem será enviada ao Gemini para análise. Não envie senhas, dados bancários ou documentos pessoais. Continuar?',
  );
  if (!accepted) throw new Error('Envio cancelado antes da análise.');
  sessionStorage.setItem('screen-assistant-privacy-confirmed', 'yes');
}

export function clearPilotAccess() {
  sessionStorage.removeItem('screen-assistant-access-token');
}

export async function requestAnalysis({ imageBlob, question = '', signal, onStage = () => {} }) {
  if (!(imageBlob instanceof Blob) || !imageBlob.size) throw new Error('Selecione uma imagem antes de analisar.');
  if (question.length > 1000) throw new Error('A pergunta excede 1.000 caracteres.');

  confirmPrivacyOnce();
  const accessToken = getAccessToken();
  const analysisContext = getAnalysisContext();

  onStage('prepare');
  const form = new FormData();
  form.append('image', imageBlob, imageBlob.type === 'image/jpeg' ? 'image.jpg' : 'image.webp');
  form.append('question', question);
  form.append('profileId', analysisContext.profileId);
  form.append('taskId', analysisContext.taskId);
  form.append('responseMode', analysisContext.responseMode);

  onStage('send');
  const timers = [
    setTimeout(() => onStage('analyze'), 650),
    setTimeout(() => onStage('fallback'), 9200),
  ];

  try {
    const response = await fetch('/api/v1/analyze-screen', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-request-id': crypto.randomUUID(),
      },
      body: form,
      signal,
    });
    const payload = await readApiResponse(response);
    if (!response.ok) {
      if (response.status === 401) clearPilotAccess();
      throw new Error(payload.error?.message || 'Falha na análise.');
    }
    onStage('format');
    return payload;
  } finally {
    timers.forEach(clearTimeout);
  }
}

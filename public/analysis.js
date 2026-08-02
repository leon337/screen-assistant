import { readApiResponse } from './http.js';
import { getSelectedProfileId, getProfile } from './expert-profiles.js';

export const ANALYSIS_STAGES = ['prepare', 'send', 'analyze', 'fallback', 'format'];

function getStoredAccessToken() {
  return sessionStorage.getItem('screen-assistant-access-token')?.trim() || '';
}

export function clearPilotAccess() {
  sessionStorage.removeItem('screen-assistant-access-token');
}

export async function requestAnalysis({ imageBlob, question = '', profileId = getSelectedProfileId(), signal, onStage = () => {} }) {
  if (!(imageBlob instanceof Blob) || !imageBlob.size) throw new Error('Selecione uma imagem antes de analisar.');
  if (question.length > 1000) throw new Error('A pergunta excede 1.000 caracteres.');

  const accessToken = getStoredAccessToken();
  const selectedProfile = getProfile(profileId);

  onStage('prepare');
  const form = new FormData();
  form.append('image', imageBlob, imageBlob.type === 'image/jpeg' ? 'image.jpg' : 'image.webp');
  form.append('question', question);
  form.append('profileId', selectedProfile.id);

  onStage('send');
  const timers = [
    setTimeout(() => onStage('analyze'), 650),
    setTimeout(() => onStage('fallback'), 9200),
  ];

  const headers = { 'x-request-id': crypto.randomUUID() };
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  try {
    const response = await fetch('/api/v1/analyze-screen', {
      method: 'POST',
      headers,
      body: form,
      signal,
    });
    const payload = await readApiResponse(response);
    if (!response.ok) {
      if (response.status === 401) clearPilotAccess();
      throw new Error(payload.error?.message || 'Falha na análise.');
    }

    const expert = payload.data?.expertProfile || {
      id: selectedProfile.id,
      name: selectedProfile.name,
      fallbackUsed: false,
    };
    payload.data.expertProfile = expert;
    payload.data.model = `${expert.name} · ${payload.data.model}`;

    onStage('format');
    return payload;
  } finally {
    timers.forEach(clearTimeout);
  }
}

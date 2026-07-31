import { readApiResponse } from './http.js';

export const ANALYSIS_STAGES = ['prepare', 'send', 'analyze', 'fallback', 'format'];

export async function requestAnalysis({ imageBlob, question = '', signal, onStage = () => {} }) {
  if (!(imageBlob instanceof Blob) || !imageBlob.size) throw new Error('Selecione uma imagem antes de analisar.');

  onStage('prepare');
  const form = new FormData();
  form.append('image', imageBlob, imageBlob.type === 'image/jpeg' ? 'image.jpg' : 'image.webp');
  form.append('question', question);

  onStage('send');
  const timers = [
    setTimeout(() => onStage('analyze'), 650),
    setTimeout(() => onStage('fallback'), 9200),
  ];

  try {
    const response = await fetch('/api/v1/analyze-screen', {
      method: 'POST',
      headers: {
        authorization: 'Bearer preview-demo-token',
        'x-request-id': crypto.randomUUID(),
      },
      body: form,
      signal,
    });
    const payload = await readApiResponse(response);
    if (!response.ok) throw new Error(payload.error?.message || 'Falha na análise.');
    onStage('format');
    return payload;
  } finally {
    timers.forEach(clearTimeout);
  }
}

import { readApiResponse } from './http.js';
import { getAccessToken, signOut } from './auth-v20.js';

export const ANALYSIS_STAGES = ['prepare', 'send', 'analyze', 'fallback', 'format'];

let analysisContextProvider = () => ({
  intentId: null,
  profileId: null,
  taskId: null,
  responseMode: 'standard',
});

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const intentModule = await import('./intent-v22a.js');
  analysisContextProvider = intentModule.getAnalysisContext;
}

export async function requestAnalysis({ imageBlob, question = '', signal, onStage = () => {} }) {
  if (!(imageBlob instanceof Blob) || !imageBlob.size) throw new Error('Selecione uma imagem antes de analisar.');
  if (question.length > 1000) throw new Error('A pergunta excede 1.000 caracteres.');

  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('Entre na sua conta para realizar uma análise.');
  const analysisContext = analysisContextProvider();
  if (!analysisContext.intentId || !analysisContext.profileId || !analysisContext.taskId) {
    throw new Error('Escolha o que deseja descobrir antes de analisar.');
  }

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
      if (response.status === 401) {
        await signOut();
        throw new Error('Sua sessão expirou. Recarregue a página e entre novamente.');
      }
      throw new Error(payload.error?.message || 'Falha na análise.');
    }
    onStage('format');
    return payload;
  } finally {
    timers.forEach(clearTimeout);
  }
}

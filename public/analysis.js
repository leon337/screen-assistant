import { readApiResponse } from './http.js';
import { ensurePilotAccess, clearPilotAccess } from './pilot-access-v19.js';

export const ANALYSIS_STAGES = ['prepare', 'send', 'analyze', 'fallback', 'format'];

let analysisContextProvider = () => ({
  profileId: 'general',
  taskId: 'explain',
  responseMode: 'standard',
});

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const intentModule = await import('./intent-v19.js');
  analysisContextProvider = intentModule.getAnalysisContext;
}

export { clearPilotAccess };

export async function requestAnalysis({ imageBlob, question = '', signal, onStage = () => {} }) {
  if (!(imageBlob instanceof Blob) || !imageBlob.size) throw new Error('Selecione uma imagem antes de analisar.');
  if (question.length > 1000) throw new Error('A pergunta excede 1.000 caracteres.');

  const accessToken = await ensurePilotAccess();
  const analysisContext = analysisContextProvider();

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
        clearPilotAccess();
        throw new Error('Código de acesso inválido. Tente novamente com o código do piloto.');
      }
      throw new Error(payload.error?.message || 'Falha na análise.');
    }
    onStage('format');
    return payload;
  } finally {
    timers.forEach(clearTimeout);
  }
}

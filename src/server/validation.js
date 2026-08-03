import {
  DEFAULT_PROFILE_ID,
  DEFAULT_TASK_ID,
  isValidProfileId,
  isValidTaskId,
  normalizeResponseMode,
} from './expert-profiles.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/webp', 'image/jpeg']);

export function validateAnalysisInput(formData, config) {
  const image = formData.get('image');
  const question = String(formData.get('question') || '').trim();
  const rawProfileId = String(formData.get('profileId') || DEFAULT_PROFILE_ID).trim();
  const rawTaskId = String(formData.get('taskId') || DEFAULT_TASK_ID).trim();
  const responseMode = normalizeResponseMode(formData.get('responseMode'));

  if (!(image instanceof File) || image.size === 0) {
    return { error: { status: 400, code: 'IMAGE_REQUIRED', message: 'Envie uma imagem.' } };
  }
  if (image.size > config.maxImageBytes) {
    return { error: { status: 413, code: 'IMAGE_TOO_LARGE', message: 'A imagem excede o limite permitido.' } };
  }
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return { error: { status: 415, code: 'IMAGE_FORMAT_INVALID', message: 'Use WebP ou JPEG.' } };
  }
  if (question.length > config.maxQuestionChars) {
    return { error: { status: 413, code: 'QUESTION_TOO_LONG', message: `A pergunta excede ${config.maxQuestionChars} caracteres.` } };
  }

  return {
    image,
    question,
    profileId: isValidProfileId(rawProfileId) ? rawProfileId : DEFAULT_PROFILE_ID,
    taskId: isValidTaskId(rawTaskId) ? rawTaskId : DEFAULT_TASK_ID,
    responseMode,
    profileFallbackUsed: !isValidProfileId(rawProfileId),
    taskFallbackUsed: !isValidTaskId(rawTaskId),
  };
}

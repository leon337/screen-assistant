import { DEFAULT_EXPERT_PROFILE_ID, isValidExpertProfileId } from './expert-profiles.js';

const ALLOWED_IMAGE_TYPES = new Set(['image/webp', 'image/jpeg']);

export function validateAnalysisInput(formData, config) {
  const image = formData.get('image');
  const question = String(formData.get('question') || '').trim();
  const suppliedProfileId = String(formData.get('profileId') || DEFAULT_EXPERT_PROFILE_ID).trim();

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

  const profileId = isValidExpertProfileId(suppliedProfileId)
    ? suppliedProfileId
    : DEFAULT_EXPERT_PROFILE_ID;

  return {
    image,
    question,
    profileId,
    profileFallbackUsed: profileId !== suppliedProfileId,
  };
}

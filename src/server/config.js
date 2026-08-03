const DEFAULT_SUPABASE_URL = 'https://qylqyhxpwffiripcpjej.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_UAUGspLhLkNcMawj6tFvtg_7BoRe1Ih';

const integer = (value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export function loadConfig(env = process.env) {
  return Object.freeze({
    appEnv: String(env.APP_ENV || 'preview').trim(),
    release: String(env.APP_RELEASE || 'phase-20-saas-auth').trim(),
    supabaseUrl: String(env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, ''),
    supabasePublishableKey: String(
      env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY,
    ).trim(),
    aiMode: String(env.AI_MODE || 'simulated').trim(),
    geminiApiKey: String(env.GEMINI_API_KEY || '').trim(),
    geminiModel: String(env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),
    geminiFallbackModel: String(env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite').trim(),
    geminiTimeoutMs: integer(env.GEMINI_TIMEOUT_MS, 8500, { min: 1000, max: 60000 }),
    geminiTtsModel: String(env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview').trim(),
    geminiTtsVoice: String(env.GEMINI_TTS_VOICE || 'Sulafat').trim(),
    geminiTtsTimeoutMs: integer(env.GEMINI_TTS_TIMEOUT_MS, 18000, { min: 3000, max: 60000 }),
    maxSpeechChars: integer(env.MAX_SPEECH_CHARS, 4000, { min: 200, max: 8000 }),
    speechRateLimitMax: integer(env.SPEECH_RATE_LIMIT_MAX, 10, { min: 1, max: 1000 }),
    speechRateLimitWindowMs: integer(env.SPEECH_RATE_LIMIT_WINDOW_MS, 60000, { min: 1000, max: 86400000 }),
    maxImageBytes: integer(env.MAX_IMAGE_BYTES, 2 * 1024 * 1024, { min: 1024, max: 10 * 1024 * 1024 }),
    maxQuestionChars: integer(env.MAX_QUESTION_CHARS, 1000, { min: 1, max: 10000 }),
    rateLimitMax: integer(env.RATE_LIMIT_MAX, 20, { min: 1, max: 10000 }),
    rateLimitWindowMs: integer(env.RATE_LIMIT_WINDOW_MS, 60000, { min: 1000, max: 86400000 }),
  });
}

export function validateAuthConfig(config) {
  const missing = [];
  if (!/^https:\/\/.+\.supabase\.co$/i.test(config.supabaseUrl)) missing.push('SUPABASE_URL');
  if (config.supabasePublishableKey.length < 20) missing.push('SUPABASE_PUBLISHABLE_KEY');
  return missing;
}

export function validateConfig(config) {
  const missing = [...validateAuthConfig(config)];
  if (config.aiMode !== 'gemini') missing.push('AI_MODE=gemini');
  if (config.geminiApiKey.length < 10) missing.push('GEMINI_API_KEY');
  return missing;
}

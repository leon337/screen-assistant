const DEFAULT_SAMPLE_RATE = 24000;
const DEFAULT_CHANNELS = 1;
const DEFAULT_SAMPLE_WIDTH = 2;

function normalizeTranscript(value, maxChars) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxChars);
}

function buildPrompt(text) {
  return [
    'Perfil de áudio: assistente brasileira adulta, natural, clara, serena e didática.',
    'Cena: conversa privada em um aplicativo de assistência visual.',
    'Direção: fale em português do Brasil neutro, com ritmo de conversa, articulação confortável e pausas curtas entre ideias.',
    'Não use tom publicitário, teatral ou robótico. Não acrescente, resuma ou interprete conteúdo.',
    'Leia exatamente a transcrição abaixo e preserve números, horários, valores e unidades.',
    '',
    '<transcricao>',
    text,
    '</transcricao>',
  ].join('\n');
}

function extractAudio(payload) {
  const parts = (payload?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || []);

  for (const part of parts) {
    const inline = part?.inlineData || part?.inline_data;
    if (inline?.data) {
      return {
        audioBase64: inline.data,
        mimeType: inline.mimeType || inline.mime_type || 'audio/L16;codec=pcm;rate=24000',
      };
    }
  }

  return null;
}

function providerError(status) {
  if (status === 429) {
    return { status: 429, code: 'TTS_RATE_LIMIT', message: 'A cota da voz natural foi atingida temporariamente.' };
  }
  if ([401, 403].includes(status)) {
    return { status: 503, code: 'TTS_KEY_REJECTED', message: 'A voz natural está temporariamente indisponível.' };
  }
  if (status === 404) {
    return { status: 503, code: 'TTS_MODEL_UNAVAILABLE', message: 'O modelo de voz natural não está disponível.' };
  }
  return { status: 503, code: 'TTS_PROVIDER_UNAVAILABLE', message: 'A voz natural está temporariamente indisponível.' };
}

export async function synthesizeWithGeminiTts({
  config,
  text,
  requestId,
  fetchImpl = fetch,
  logger = console,
}) {
  const transcript = normalizeTranscript(text, config.maxSpeechChars);
  if (!transcript) {
    return { error: { status: 400, code: 'TTS_TEXT_EMPTY', message: 'Não há texto disponível para leitura.' } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.geminiTtsTimeoutMs);
  let response;
  let payload = {};

  try {
    response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiTtsModel)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': config.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(transcript) }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: config.geminiTtsVoice },
              },
            },
          },
        }),
        signal: controller.signal,
      },
    );
    payload = await response.json().catch(() => ({}));
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { error: { status: 503, code: 'TTS_TIMEOUT', message: 'A geração da voz demorou além do limite.' } };
    }
    return { error: { status: 503, code: 'TTS_NETWORK', message: 'Não foi possível gerar a voz natural.' } };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const provider = payload?.error || {};
    logger.error(JSON.stringify({
      event: 'gemini_tts_failure',
      requestId,
      model: config.geminiTtsModel,
      httpStatus: response.status,
      status: provider.status,
      message: String(provider.message || '').slice(0, 180),
    }));
    return { error: providerError(response.status) };
  }

  const audio = extractAudio(payload);
  if (!audio) {
    return { error: { status: 502, code: 'TTS_AUDIO_EMPTY', message: 'O modelo não retornou áudio.' } };
  }

  return {
    ...audio,
    sampleRate: DEFAULT_SAMPLE_RATE,
    channels: DEFAULT_CHANNELS,
    sampleWidth: DEFAULT_SAMPLE_WIDTH,
    model: config.geminiTtsModel,
    voice: config.geminiTtsVoice,
    transcriptChars: transcript.length,
  };
}

export const ttsInternals = Object.freeze({
  normalizeTranscript,
  buildPrompt,
  extractAudio,
});

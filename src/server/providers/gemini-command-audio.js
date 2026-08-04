function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function providerError(status) {
  if (status === 429) {
    return { status: 429, code: 'VOICE_COMMAND_RATE_LIMIT', message: 'O serviço de comandos por voz atingiu o limite temporário.' };
  }
  if ([401, 403].includes(status)) {
    return { status: 503, code: 'VOICE_COMMAND_KEY_REJECTED', message: 'Os comandos por voz estão temporariamente indisponíveis.' };
  }
  if (status === 404) {
    return { status: 503, code: 'VOICE_COMMAND_MODEL_UNAVAILABLE', message: 'O modelo de comandos por voz não está disponível.' };
  }
  return { status: 503, code: 'VOICE_COMMAND_PROVIDER_UNAVAILABLE', message: 'Os comandos por voz estão temporariamente indisponíveis.' };
}

function extractTranscript(payload) {
  return String(payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join(' ') || '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/^comando\s*:\s*/i, '')
    .trim();
}

export async function transcribeCommandWithGemini({ config, audio, requestId }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.voiceCommandTimeoutMs);

  try {
    const audioBuffer = await audio.arrayBuffer();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': config.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                text: [
                  'Transcreva somente o comando falado em português do Brasil.',
                  'Retorne apenas as palavras pronunciadas, sem explicação, sem aspas e sem pontuação desnecessária.',
                  'Os comandos esperados são curtos, como: ler, parar, analisar, novo, repetir, rápido, devagar, normal ou ajuda.',
                  'Se não houver fala compreensível, retorne exatamente SEM_COMANDO.',
                ].join(' '),
              },
              {
                inlineData: {
                  mimeType: audio.type || 'audio/webm',
                  data: bytesToBase64(audioBuffer),
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 40,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const mapped = providerError(response.status);
      console.error(JSON.stringify({
        event: 'gemini_voice_command_failure',
        requestId,
        model: config.geminiModel,
        httpStatus: response.status,
        detail: detail.slice(0, 180),
      }));
      return { error: mapped };
    }

    const payload = await response.json();
    const transcript = extractTranscript(payload);
    if (!transcript || transcript === 'SEM_COMANDO') {
      return { error: { status: 422, code: 'VOICE_COMMAND_NOT_DETECTED', message: 'Nenhum comando de voz foi identificado.' } };
    }

    return { transcript, model: config.geminiModel };
  } catch (error) {
    const timeoutError = error?.name === 'AbortError';
    console.error(JSON.stringify({
      event: 'gemini_voice_command_exception',
      requestId,
      model: config.geminiModel,
      type: timeoutError ? 'timeout' : 'network',
    }));
    return {
      error: timeoutError
        ? { status: 504, code: 'VOICE_COMMAND_TIMEOUT', message: 'O comando demorou demais para ser reconhecido.' }
        : { status: 503, code: 'VOICE_COMMAND_NETWORK', message: 'Não foi possível reconhecer o comando agora.' },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const commandAudioInternals = Object.freeze({ extractTranscript });

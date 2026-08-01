async function toBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 32768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  }
  return btoa(binary);
}

function extractText(payload) {
  return (payload?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text?.trim?.() || '')
    .filter(Boolean)
    .join('\n\n');
}

async function callModel({ apiKey, model, image, prompt, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: image.type, data: await toBase64(image) } },
            { text: prompt },
          ] }],
          generationConfig: { maxOutputTokens: 700 },
        }),
        signal: controller.signal,
      },
    );
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeWithGemini({ config, image, prompt, requestId, logger = console }) {
  const models = [...new Set([config.geminiModel, config.geminiFallbackModel])];
  let last;
  let fallbackReason;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      last = await callModel({ apiKey: config.geminiApiKey, model, image, prompt, timeoutMs: config.geminiTimeoutMs });
    } catch {
      if (index === 0) {
        fallbackReason = 'TIMEOUT';
        continue;
      }
      return { error: { status: 503, code: 'PROVIDER_TIMEOUT', message: 'A análise demorou além do limite. Tente novamente.' } };
    }

    if (last.response.ok) {
      const answer = extractText(last.payload);
      if (!answer) return { error: { status: 502, code: 'EMPTY', message: 'O Gemini não retornou texto.' } };
      return {
        answer,
        model,
        fallback: { used: index > 0, reason: fallbackReason },
      };
    }

    const providerError = last.payload?.error || {};
    logger.error(JSON.stringify({
      event: 'gemini_failure', requestId, model,
      httpStatus: last.response.status,
      status: providerError.status,
      message: String(providerError.message || '').slice(0, 250),
    }));

    const eligible = last.response.status === 404 || last.response.status === 429 || last.response.status >= 500;
    if (index === 0 && eligible) {
      fallbackReason = last.response.status === 429 ? 'RATE_LIMIT' : 'UNAVAILABLE';
      continue;
    }
    break;
  }

  const status = last?.response?.status;
  if (status === 429) return { error: { status: 429, code: 'RATE_LIMIT', message: 'A cota do Gemini foi atingida.' } };
  if ([401, 403].includes(status)) return { error: { status: 503, code: 'KEY_REJECTED', message: 'A chave do Gemini foi recusada.' } };
  if (status === 404) return { error: { status: 503, code: 'MODEL_UNAVAILABLE', message: 'O modelo não está disponível.' } };
  return { error: { status: 503, code: 'PROVIDER_UNAVAILABLE', message: 'O Gemini está temporariamente indisponível.' } };
}

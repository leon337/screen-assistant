export async function readApiResponse(response) {
  const raw = await response.text();

  if (!raw.trim()) {
    throw new Error('O servidor não retornou uma resposta. Tente novamente.');
  }

  try {
    return JSON.parse(raw);
  } catch {
    if ([502, 503, 504].includes(response.status)) {
      throw new Error('A análise demorou além do limite do servidor. Tente novamente.');
    }

    throw new Error('O servidor retornou uma resposta inválida. Atualize a página e tente novamente.');
  }
}

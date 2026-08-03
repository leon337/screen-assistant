export function readBearer(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || '';
}

export async function authenticateRequest(request, config, fetchImpl = fetch) {
  const token = readBearer(request);
  if (!token) {
    return {
      error: {
        status: 401,
        code: 'AUTH_REQUIRED',
        message: 'Entre na sua conta para continuar.',
      },
    };
  }

  try {
    const response = await fetchImpl(`${config.supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: config.supabasePublishableKey,
        authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        error: {
          status: 401,
          code: 'SESSION_INVALID',
          message: 'Sua sessão expirou. Entre novamente.',
        },
      };
    }

    const user = await response.json();
    if (!user?.id || !user?.email) {
      return {
        error: {
          status: 401,
          code: 'SESSION_INVALID',
          message: 'Não foi possível validar sua conta.',
        },
      };
    }

    return { user, token };
  } catch {
    return {
      error: {
        status: 503,
        code: 'AUTH_UNAVAILABLE',
        message: 'O serviço de autenticação está temporariamente indisponível.',
      },
    };
  }
}

import { loadConfig, validateAuthConfig } from '../../src/server/config.js';
import { apiError, responseHeaders } from '../../src/server/errors.js';

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const appConfig = loadConfig();

  if (request.method !== 'GET') {
    return apiError(requestId, appConfig.release, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
  }

  const missing = validateAuthConfig(appConfig);
  if (missing.length) {
    console.error(JSON.stringify({ event: 'auth_configuration_invalid', requestId, missing }));
    return apiError(requestId, appConfig.release, 503, 'AUTH_CONFIG', 'Autenticação ainda não configurada.');
  }

  return new Response(JSON.stringify({
    status: 'success',
    data: {
      supabaseUrl: appConfig.supabaseUrl,
      publishableKey: appConfig.supabasePublishableKey,
      release: appConfig.release,
    },
  }), {
    headers: responseHeaders(requestId, appConfig.release, {
      'cache-control': 'no-store',
    }),
  });
}

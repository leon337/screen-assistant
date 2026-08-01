import { loadConfig } from '../../src/server/config.js';

export const config = { runtime: 'edge' };

function readiness(config) {
  const accessConfigured = config.accessToken.length >= 16;
  const providerConfigured = config.aiMode === 'gemini' && config.geminiApiKey.length >= 10;

  return {
    accessConfigured,
    providerConfigured,
    ready: accessConfigured && providerConfigured,
  };
}

export default function handler(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const appConfig = loadConfig();
  const state = readiness(appConfig);

  return new Response(JSON.stringify({
    status: 'success',
    data: {
      requestId,
      release: appConfig.release,
      environment: appConfig.appEnv,
      application: state.ready ? 'ready' : 'attention',
      access: {
        required: true,
        configured: state.accessConfigured,
      },
      provider: {
        name: 'gemini',
        configured: state.providerConfigured,
        primaryModel: appConfig.geminiModel,
        fallbackModel: appConfig.geminiFallbackModel,
      },
      limits: {
        maxImageBytes: appConfig.maxImageBytes,
        maxQuestionChars: appConfig.maxQuestionChars,
      },
      checkedAt: new Date().toISOString(),
    },
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-request-id': requestId,
      'x-app-release': appConfig.release,
    },
  });
}

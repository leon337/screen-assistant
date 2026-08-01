export function responseHeaders(requestId, release, extra = {}) {
  return {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-request-id': requestId,
    'x-release-id': release,
    ...extra,
  };
}

export function apiError(requestId, release, status, code, message, extraHeaders = {}) {
  return new Response(JSON.stringify({ status: 'error', error: { code, message, requestId } }), {
    status,
    headers: responseHeaders(requestId, release, extraHeaders),
  });
}

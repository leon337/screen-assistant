const SESSION_KEY = 'screen-assistant-saas-session';
const REFRESH_MARGIN_SECONDS = 90;

let authConfigPromise = null;
let session = readStoredSession();
const listeners = new Set();

function hasBrowserStorage() {
  return typeof localStorage !== 'undefined';
}

function readStoredSession() {
  if (!hasBrowserStorage()) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return parsed?.accessToken && parsed?.refreshToken ? parsed : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function notify() {
  for (const listener of listeners) listener(session);
}

function saveSession(nextSession) {
  session = nextSession;
  if (hasBrowserStorage()) {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }
  notify();
  return session;
}

function normalizeSession(payload) {
  const accessToken = payload?.access_token || payload?.session?.access_token;
  const refreshToken = payload?.refresh_token || payload?.session?.refresh_token;
  const expiresIn = Number(payload?.expires_in || payload?.session?.expires_in || 3600);
  const expiresAt = Number(payload?.expires_at || payload?.session?.expires_at || Math.floor(Date.now() / 1000) + expiresIn);
  const user = payload?.user || payload?.session?.user || null;
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, expiresAt, user };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { message: text }; }
}

function friendlyMessage(payload, fallback) {
  const source = String(payload?.msg || payload?.message || payload?.error_description || payload?.error || '').toLowerCase();
  if (source.includes('invalid login credentials')) return 'E-mail ou senha inválidos.';
  if (source.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (source.includes('user already registered')) return 'Já existe uma conta com este e-mail.';
  if (source.includes('password')) return 'A senha não atende aos requisitos de segurança.';
  if (source.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  return fallback;
}

export async function getAuthConfig() {
  if (!authConfigPromise) {
    authConfigPromise = fetch('/api/v1/auth-config', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await readJson(response);
        if (!response.ok) throw new Error(payload?.error?.message || 'Autenticação ainda não configurada.');
        return payload.data;
      })
      .catch((error) => {
        authConfigPromise = null;
        throw error;
      });
  }
  return authConfigPromise;
}

async function authFetch(path, { method = 'POST', body, accessToken } = {}) {
  const config = await getAuthConfig();
  const headers = { apikey: config.publishableKey };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${config.supabaseUrl}/auth/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const payload = await readJson(response);
  if (!response.ok) {
    const error = new Error(friendlyMessage(payload, 'Não foi possível concluir a autenticação.'));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function signIn({ email, password }) {
  const payload = await authFetch('/token?grant_type=password', { body: { email: email.trim(), password } });
  const next = normalizeSession(payload);
  if (!next) throw new Error('O serviço não retornou uma sessão válida.');
  return saveSession(next);
}

export async function signUp({ displayName, email, password }) {
  const payload = await authFetch('/signup', {
    body: {
      email: email.trim(),
      password,
      data: { display_name: displayName.trim() },
    },
  });
  const next = normalizeSession(payload);
  if (next) saveSession(next);
  return {
    session: next,
    user: payload.user || next?.user || null,
    confirmationRequired: !next,
  };
}

export async function requestPasswordReset(email) {
  return authFetch('/recover', {
    body: {
      email: email.trim(),
      redirect_to: `${location.origin}/?password-reset=1`,
    },
  });
}

export async function updatePassword(password) {
  const current = await getValidSession();
  if (!current) throw new Error('A sessão de recuperação expirou. Solicite um novo link.');
  await authFetch('/user', { method: 'PUT', body: { password }, accessToken: current.accessToken });
}

export async function refreshSession() {
  if (!session?.refreshToken) return saveSession(null);
  try {
    const payload = await authFetch('/token?grant_type=refresh_token', {
      body: { refresh_token: session.refreshToken },
    });
    const next = normalizeSession(payload);
    if (!next) throw new Error('Sessão inválida.');
    return saveSession(next);
  } catch (error) {
    saveSession(null);
    throw error;
  }
}

export async function getValidSession() {
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt - now <= REFRESH_MARGIN_SECONDS) return refreshSession();
  return session;
}

export async function getAccessToken() {
  return (await getValidSession())?.accessToken || '';
}

export function getCurrentSession() {
  return session;
}

export function onAuthStateChange(listener) {
  listeners.add(listener);
  listener(session);
  return () => listeners.delete(listener);
}

export async function signOut() {
  const current = session;
  saveSession(null);
  if (!current?.accessToken) return;
  try {
    await authFetch('/logout', { accessToken: current.accessToken });
  } catch {
    // A sessão local já foi removida. Falhas remotas não mantêm o usuário conectado neste aparelho.
  }
}

export function consumeSessionFromUrl() {
  if (typeof location === 'undefined') return false;
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresIn = Number(params.get('expires_in') || 3600);
  const recovery = params.get('type') === 'recovery' || new URLSearchParams(location.search).get('password-reset') === '1';

  if (accessToken && refreshToken) {
    saveSession({
      accessToken,
      refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
      user: null,
    });
    history.replaceState({}, document.title, location.pathname);
  }
  return recovery;
}

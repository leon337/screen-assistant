import {
  consumeSessionFromUrl,
  getValidSession,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from './auth-v20.js';

const state = {
  mode: 'login',
  message: '',
  tone: 'neutral',
  busy: false,
  recovery: false,
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createRoot() {
  let root = document.getElementById('auth-v20-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'auth-v20-root';
    document.body.prepend(root);
  }
  return root;
}

function renderAuth() {
  const root = createRoot();
  const mode = state.recovery ? 'reset' : state.mode;
  const title = mode === 'register' ? 'Criar sua conta'
    : mode === 'forgot' ? 'Recuperar acesso'
      : mode === 'reset' ? 'Definir nova senha'
        : 'Entrar no Screen Assistant';
  const subtitle = mode === 'register' ? 'Crie uma conta para usar seus agentes de análise.'
    : mode === 'forgot' ? 'Enviaremos um link seguro para o seu e-mail.'
      : mode === 'reset' ? 'Escolha uma nova senha para continuar.'
        : 'Acesse sua área de análises e agentes.';

  root.innerHTML = `
    <section class="auth-v20-shell" aria-labelledby="auth-v20-title">
      <div class="auth-v20-visual" aria-hidden="true">
        <div class="auth-v20-brand-mark">S</div>
        <p>Predix AI Lab</p>
        <h1>Screen Assistant</h1>
        <span>Uma plataforma de agentes especializados para analisar imagens, interfaces, código e gráficos.</span>
        <ul>
          <li>Leonardo Trader</li>
          <li>Engenharia de Software</li>
          <li>Arquitetura e UX</li>
        </ul>
      </div>

      <div class="auth-v20-card">
        <div class="auth-v20-card-heading">
          <p class="auth-v20-kicker">Plataforma SaaS</p>
          <h2 id="auth-v20-title">${title}</h2>
          <span>${subtitle}</span>
        </div>

        ${mode === 'login' ? loginForm() : ''}
        ${mode === 'register' ? registerForm() : ''}
        ${mode === 'forgot' ? forgotForm() : ''}
        ${mode === 'reset' ? resetForm() : ''}

        <p class="auth-v20-message" data-tone="${state.tone}" role="status" aria-live="polite">${escapeHtml(state.message)}</p>
      </div>
    </section>
  `;

  bindAuthEvents(root, mode);
}

function loginForm() {
  return `
    <form class="auth-v20-form" data-auth-form="login">
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <label>Senha<input name="password" type="password" autocomplete="current-password" minlength="8" required></label>
      <button class="auth-v20-primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Entrando…' : 'Entrar'}</button>
      <button class="auth-v20-link" type="button" data-auth-mode="forgot">Esqueci minha senha</button>
      <div class="auth-v20-divider"><span>ou</span></div>
      <button class="auth-v20-secondary" type="button" data-auth-mode="register">Criar conta</button>
    </form>
  `;
}

function registerForm() {
  return `
    <form class="auth-v20-form" data-auth-form="register">
      <label>Nome<input name="displayName" type="text" autocomplete="name" minlength="2" maxlength="80" required></label>
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <label>Senha<input name="password" type="password" autocomplete="new-password" minlength="8" required><small>Mínimo de 8 caracteres.</small></label>
      <label>Confirmar senha<input name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required></label>
      <label class="auth-v20-consent"><input name="terms" type="checkbox" required><span>Concordo em usar a plataforma de forma responsável e não enviar dados pessoais sensíveis nas imagens.</span></label>
      <button class="auth-v20-primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Criando…' : 'Criar conta'}</button>
      <button class="auth-v20-link" type="button" data-auth-mode="login">Já tenho uma conta</button>
    </form>
  `;
}

function forgotForm() {
  return `
    <form class="auth-v20-form" data-auth-form="forgot">
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <button class="auth-v20-primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Enviando…' : 'Enviar link de recuperação'}</button>
      <button class="auth-v20-link" type="button" data-auth-mode="login">Voltar para entrar</button>
    </form>
  `;
}

function resetForm() {
  return `
    <form class="auth-v20-form" data-auth-form="reset">
      <label>Nova senha<input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
      <label>Confirmar nova senha<input name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required></label>
      <button class="auth-v20-primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Atualizando…' : 'Salvar nova senha'}</button>
    </form>
  `;
}

function setMode(mode) {
  state.mode = mode;
  state.message = '';
  state.tone = 'neutral';
  renderAuth();
}

async function submit(root, mode, form) {
  const data = new FormData(form);
  state.busy = true;
  state.message = '';
  renderAuth();

  try {
    if (mode === 'login') {
      const session = await signIn({
        email: String(data.get('email') || ''),
        password: String(data.get('password') || ''),
      });
      activateApplication(session);
      return;
    }

    if (mode === 'register') {
      const password = String(data.get('password') || '');
      if (password !== String(data.get('passwordConfirm') || '')) throw new Error('As senhas não coincidem.');
      const result = await signUp({
        displayName: String(data.get('displayName') || ''),
        email: String(data.get('email') || ''),
        password,
      });
      if (result.session) {
        activateApplication(result.session);
        return;
      }
      state.mode = 'login';
      state.message = 'Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.';
      state.tone = 'success';
    }

    if (mode === 'forgot') {
      await requestPasswordReset(String(data.get('email') || ''));
      state.message = 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.';
      state.tone = 'success';
    }

    if (mode === 'reset') {
      const password = String(data.get('password') || '');
      if (password !== String(data.get('passwordConfirm') || '')) throw new Error('As senhas não coincidem.');
      await updatePassword(password);
      state.recovery = false;
      const session = await getValidSession();
      activateApplication(session);
      return;
    }
  } catch (error) {
    state.message = error instanceof Error ? error.message : 'Não foi possível concluir a solicitação.';
    state.tone = 'error';
  } finally {
    state.busy = false;
    if (document.body.dataset.authState !== 'authenticated') renderAuth();
  }
}

function bindAuthEvents(root, mode) {
  for (const button of root.querySelectorAll('[data-auth-mode]')) {
    button.addEventListener('click', () => setMode(button.dataset.authMode));
  }
  const form = root.querySelector('[data-auth-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    submit(root, mode, event.currentTarget);
  });
}

function installAccountControls(session) {
  const actions = document.querySelector('.premium-top-actions');
  if (!actions || document.getElementById('auth-v20-account')) return;

  const account = document.createElement('div');
  account.id = 'auth-v20-account';
  account.className = 'auth-v20-account';
  const name = session?.user?.user_metadata?.display_name || session?.user?.email || 'Minha conta';
  account.innerHTML = `
    <span class="auth-v20-user" title="${escapeHtml(session?.user?.email || '')}">${escapeHtml(name)}</span>
    <button class="premium-icon-button" type="button" data-auth-signout>Sair</button>
  `;
  account.querySelector('[data-auth-signout]').addEventListener('click', async () => {
    await signOut();
    location.reload();
  });
  actions.prepend(account);
}

function activateApplication(session) {
  document.body.dataset.authState = 'authenticated';
  document.getElementById('auth-v20-root')?.remove();
  installAccountControls(session);
}

export async function initializeAuthGate() {
  document.body.dataset.authState = 'loading';
  state.recovery = consumeSessionFromUrl();

  try {
    const current = await getValidSession();
    if (current && !state.recovery) {
      activateApplication(current);
      return current;
    }
  } catch {
    // Uma sessão inválida volta para a tela de login.
  }

  document.body.dataset.authState = 'anonymous';
  renderAuth();
  return null;
}

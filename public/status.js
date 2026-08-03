const stylesheetId = 'screen-assistant-status-style';
if (!document.getElementById(stylesheetId)) {
  const link = document.createElement('link');
  link.id = stylesheetId;
  link.rel = 'stylesheet';
  link.href = '/status.css';
  document.head.append(link);
}

function statusLabel(configured, readyLabel, pendingLabel) {
  return configured ? readyLabel : pendingLabel;
}

function createStatusPanel() {
  const existing = document.getElementById('operational-status');
  if (existing) return existing;

  const section = document.createElement('section');
  section.id = 'operational-status';
  section.className = 'operations-card';
  section.setAttribute('aria-labelledby', 'operational-status-title');
  section.innerHTML = `
    <div class="operations-heading">
      <div>
        <p class="section-kicker">Atualização visível</p>
        <h2 id="operational-status-title">Estado da aplicação</h2>
      </div>
      <button id="refresh-operational-status" class="secondary" type="button">Atualizar estado</button>
    </div>
    <p id="operational-status-summary" class="operations-summary" role="status" aria-live="polite">Consultando a publicação…</p>
    <dl class="operations-grid">
      <div><dt>Interface</dt><dd id="status-interface">Publicada</dd></div>
      <div><dt>API de IA</dt><dd id="status-api">Verificando…</dd></div>
      <div><dt>Autenticação</dt><dd id="status-auth">Verificando…</dd></div>
      <div><dt>Release</dt><dd id="status-release">—</dd></div>
      <div><dt>Ambiente</dt><dd id="status-environment">—</dd></div>
      <div><dt>Última verificação</dt><dd id="status-updated">—</dd></div>
    </dl>
    <p id="operational-status-note" class="operations-note">Nenhuma chave ou dado de usuário é mostrado neste painel.</p>
  `;

  const privacyBanner = document.querySelector('.privacy-banner');
  if (privacyBanner) privacyBanner.insertAdjacentElement('afterend', section);
  else document.querySelector('main')?.prepend(section);
  return section;
}

function setTone(element, tone) {
  element.dataset.tone = tone;
}

async function refreshStatus() {
  const panel = createStatusPanel();
  const summary = panel.querySelector('#operational-status-summary');
  const api = panel.querySelector('#status-api');
  const auth = panel.querySelector('#status-auth');
  const release = panel.querySelector('#status-release');
  const environment = panel.querySelector('#status-environment');
  const updated = panel.querySelector('#status-updated');
  const note = panel.querySelector('#operational-status-note');
  const button = panel.querySelector('#refresh-operational-status');

  button.disabled = true;
  summary.textContent = 'Consultando a publicação…';
  setTone(summary, 'neutral');

  try {
    const response = await fetch('/api/v1/status', {
      headers: { 'x-request-id': crypto.randomUUID() },
      cache: 'no-store',
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== 'success') throw new Error('Estado indisponível.');

    const data = payload.data;
    api.textContent = statusLabel(data.provider.configured, 'Gemini configurado', 'Gemini pendente');
    auth.textContent = statusLabel(data.auth.configured, 'Supabase configurado', 'Supabase pendente');
    release.textContent = data.release || 'Não informado';
    environment.textContent = data.environment || 'Não informado';
    updated.textContent = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short', timeStyle: 'medium',
    }).format(new Date(data.checkedAt));

    if (data.application === 'ready') {
      summary.textContent = 'Plataforma pronta para autenticação e análises.';
      note.textContent = 'Interface, autenticação Supabase e API Gemini estão configuradas.';
      setTone(summary, 'success');
    } else {
      summary.textContent = 'Aplicação publicada com pendência operacional.';
      note.textContent = data.auth.configured
        ? 'A configuração do provedor Gemini precisa ser verificada.'
        : 'Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY antes do teste com contas reais.';
      setTone(summary, 'warning');
    }
  } catch {
    api.textContent = 'Não foi possível confirmar';
    auth.textContent = 'Não foi possível confirmar';
    summary.textContent = 'Não foi possível consultar o estado agora.';
    note.textContent = 'A interface continua disponível. Tente atualizar novamente.';
    setTone(summary, 'error');
  } finally {
    button.disabled = false;
  }
}

const panel = createStatusPanel();
panel.querySelector('#refresh-operational-status')?.addEventListener('click', refreshStatus);
refreshStatus();

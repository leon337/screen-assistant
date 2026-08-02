const ACCESS_KEY = 'screen-assistant-access-token';
const PRIVACY_KEY = 'screen-assistant-privacy-confirmed';

function installStylesheet() {
  if (document.querySelector('link[data-pilot-access-v19]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/pilot-access-v19.css';
  link.dataset.pilotAccessV19 = 'true';
  document.head.append(link);
}

function storedAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY)?.trim() || '';
}

function privacyConfirmed() {
  return sessionStorage.getItem(PRIVACY_KEY) === 'yes';
}

export function clearPilotAccess() {
  sessionStorage.removeItem(ACCESS_KEY);
}

export function clearPilotSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(PRIVACY_KEY);
}

export async function ensurePilotAccess() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Acesso ao piloto indisponível fora do navegador.');
  }

  const existingToken = storedAccessToken();
  if (existingToken && privacyConfirmed()) return existingToken;

  installStylesheet();

  return new Promise((resolve, reject) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'pilot-access-dialog';
    dialog.setAttribute('aria-labelledby', 'pilot-access-title');
    dialog.innerHTML = `
      <form method="dialog" class="pilot-access-card">
        <div class="pilot-access-heading">
          <span class="pilot-access-icon" aria-hidden="true">✓</span>
          <div>
            <p class="pilot-access-kicker">Piloto protegido</p>
            <h2 id="pilot-access-title">Acesso ao Screen Assistant</h2>
          </div>
        </div>

        <p class="pilot-access-copy">
          Digite o código do piloto e confirme o envio seguro da imagem para análise pelo Gemini.
        </p>

        <label class="pilot-access-field" for="pilot-access-code">
          <span>Código de acesso</span>
          <input id="pilot-access-code" name="accessCode" type="password" autocomplete="one-time-code" inputmode="text" required>
        </label>

        <label class="pilot-access-consent">
          <input name="privacyConsent" type="checkbox" required>
          <span>Entendo que a imagem escolhida será enviada ao Gemini. Não enviarei senhas, dados bancários ou documentos pessoais.</span>
        </label>

        <p class="pilot-access-error" role="alert" aria-live="polite"></p>

        <div class="pilot-access-actions">
          <button class="secondary" type="button" data-pilot-cancel>Cancelar</button>
          <button class="primary-cta" type="submit">Continuar</button>
        </div>
      </form>
    `;

    const form = dialog.querySelector('form');
    const codeInput = dialog.querySelector('[name="accessCode"]');
    const consentInput = dialog.querySelector('[name="privacyConsent"]');
    const error = dialog.querySelector('.pilot-access-error');
    const cancel = dialog.querySelector('[data-pilot-cancel]');

    codeInput.value = existingToken;
    consentInput.checked = privacyConfirmed();

    const finish = () => {
      dialog.close();
      dialog.remove();
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const token = codeInput.value.trim();
      if (!token) {
        error.textContent = 'Digite o código de acesso do piloto.';
        codeInput.focus();
        return;
      }
      if (!consentInput.checked) {
        error.textContent = 'Confirme o aviso de privacidade para continuar.';
        consentInput.focus();
        return;
      }

      sessionStorage.setItem(ACCESS_KEY, token);
      sessionStorage.setItem(PRIVACY_KEY, 'yes');
      finish();
      resolve(token);
    });

    cancel.addEventListener('click', () => {
      finish();
      reject(new Error('Acesso ao piloto cancelado.'));
    });

    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish();
      reject(new Error('Acesso ao piloto cancelado.'));
    }, { once: true });

    document.body.append(dialog);
    dialog.showModal();
    requestAnimationFrame(() => codeInput.focus());
  });
}

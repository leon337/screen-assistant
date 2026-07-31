let deferredInstallPrompt = null;

export function setupPwa({ installButton, hintElement, onStatus = () => {} } = {}) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        onStatus('Não foi possível ativar o modo instalável neste navegador.');
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton?.classList.remove('hidden');
    if (hintElement) hintElement.textContent = 'Você pode instalar o Screen Assistant na tela inicial.';
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installButton?.classList.add('hidden');
    if (hintElement) hintElement.textContent = 'Aplicativo instalado.';
    onStatus('Screen Assistant instalado com sucesso.');
  });

  installButton?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      if (hintElement) hintElement.textContent = 'Use o menu do navegador e escolha “Adicionar à tela inicial”.';
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.classList.add('hidden');
  });
}

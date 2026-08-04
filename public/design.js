import './status.js';
import './premium-v18.js';
import { initializeAuthGate } from './auth-v20-ui.js';

document.body.dataset.authState = 'loading';
document.body.dataset.voiceControls = 'loading';
document.body.dataset.voiceDesign = 'loading';
document.body.dataset.voiceNatural = 'loading';
document.body.dataset.voiceStreaming = 'loading';
document.body.dataset.voiceDesktop = 'loading';

for (const href of ['/auth-v20.css', '/auth-v21.css', '/design-v21.css', '/result-v22.css', '/first-screen-v22a.css', '/first-screen-v22a-desktop.css', '/voice-v23.css', '/voice-v24a.css', '/voice-desktop-v24a.css']) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

await initializeAuthGate();
await import('./design-v21.js');
await import('./result-v22.js');
await import('./first-screen-v22a.js');
await import('./voice-v23.js');
await import('./voice-v23-build.js');
document.body.dataset.voiceControls = 'ready';
await import('./voice-v24a.js');
document.body.dataset.voiceDesign = 'ready';
await import('./natural-voice-v24a.js');
document.body.dataset.voiceNatural = 'ready';
await import('./natural-voice-stream-v24a.js');
document.body.dataset.voiceStreaming = 'ready';
await import('./voice-desktop-v24a.js');
document.body.dataset.voiceDesktop = 'ready';

const answer = document.getElementById('answer');

const emptyMessages = new Set([
  'Aguardando análise.',
  'A resposta aparecerá aqui depois da análise.',
]);

function synchronizeAnswerState() {
  if (!answer) return;
  const text = answer.textContent?.trim() || '';
  const busy = answer.getAttribute('aria-busy') === 'true';
  answer.classList.toggle('answer-empty', !busy && emptyMessages.has(text));
}

if (answer) {
  new MutationObserver(synchronizeAnswerState).observe(answer, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-busy'],
  });
  synchronizeAnswerState();
}

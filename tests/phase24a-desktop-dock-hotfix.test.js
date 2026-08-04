import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const hotfix = read('public/voice-desktop-dock-hotfix-v24a.js');
const loader = read('public/design.js');
const serviceWorker = read('public/service-worker.js');

test('hotfix desktop não depende da rota premiumScreen para exibir o dock', () => {
  assert.match(hotfix, /isDesktop\(\) && answerReady\(\)/);
  assert.doesNotMatch(hotfix, /premiumScreen === ['"]result['"]/);
});

test('dock reaparece se outra camada aplicar hidden com resposta pronta', () => {
  assert.match(hotfix, /dockObserver = new MutationObserver/);
  assert.match(hotfix, /attributeFilter: \['hidden'\]/);
  assert.match(hotfix, /if \(isDesktop\(\) && answerReady\(\) && dock\.hidden\) dock\.hidden = false/);
});

test('hotfix acompanha resposta concluída e estado da aplicação', () => {
  assert.match(hotfix, /answerObserver\.observe/);
  assert.match(hotfix, /attributeFilter: \['aria-busy'\]/);
  assert.match(hotfix, /data-premium-screen/);
  assert.match(hotfix, /data-auth-state/);
});

test('inicialização tolera criação tardia da barra universal', () => {
  assert.match(hotfix, /window\.setInterval/);
  assert.match(hotfix, /attempts >= 40/);
  assert.match(hotfix, /voice_desktop_dock_missing/);
});

test('runtime carrega o hotfix depois da camada desktop', () => {
  const desktopIndex = loader.indexOf("await import('./voice-desktop-v24a.js')");
  const hotfixIndex = loader.indexOf("await import('./voice-desktop-dock-hotfix-v24a.js')");
  assert.ok(desktopIndex >= 0);
  assert.ok(hotfixIndex > desktopIndex);
  assert.match(loader, /dataset\.voiceDesktopDock/);
});

test('PWA publica nova geração sem armazenar rotas de API', () => {
  assert.match(serviceWorker, /screen-assistant-v24a-desktop-dock-hotfix-1/);
  assert.match(serviceWorker, /voice-desktop-dock-hotfix-v24a\.js/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/);
});

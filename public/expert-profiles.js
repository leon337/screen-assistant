export const EXPERT_PROFILES = [
  { id: 'general', name: 'Assistente geral', icon: '✦', description: 'Leitura ampla, clara e estruturada para qualquer imagem.' },
  { id: 'software-engineer', name: 'Engenheiro de Software', icon: '⌨', description: 'Diagnostica código, erros, terminais, APIs e configurações.' },
  { id: 'software-architect', name: 'Arquiteto de Software', icon: '◇', description: 'Avalia componentes, integrações, acoplamento e escalabilidade.' },
  { id: 'trader-analyst', name: 'Trader analítico', icon: '↗', description: 'Interpreta gráficos e indicadores de forma educacional, sem recomendação financeira.' },
  { id: 'ux-specialist', name: 'Especialista em UX', icon: '▣', description: 'Analisa hierarquia visual, usabilidade e acessibilidade.' },
];

const STORAGE_KEY = 'screen-assistant-expert-profile';
const hasBrowserDom = typeof document !== 'undefined' && typeof localStorage !== 'undefined';

export function getSelectedProfileId() {
  if (!hasBrowserDom) return 'general';
  const select = document.getElementById('expert-profile');
  const selected = select?.value || localStorage.getItem(STORAGE_KEY) || 'general';
  return EXPERT_PROFILES.some((profile) => profile.id === selected) ? selected : 'general';
}

export function getProfile(profileId) {
  return EXPERT_PROFILES.find((profile) => profile.id === profileId) || EXPERT_PROFILES[0];
}

function installStylesheet() {
  if (document.querySelector('link[data-expert-profiles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/expert-profiles.css';
  link.dataset.expertProfiles = 'true';
  document.head.append(link);
}

function updateDescription(select, description) {
  const profile = getProfile(select.value);
  description.textContent = profile.description;
  localStorage.setItem(STORAGE_KEY, profile.id);
}

export function installExpertProfileSelector() {
  if (!hasBrowserDom || document.getElementById('expert-profile')) return;
  installStylesheet();

  const question = document.getElementById('question');
  const fieldGroup = question?.closest('.field-group');
  if (!fieldGroup) return;

  const wrapper = document.createElement('section');
  wrapper.className = 'expert-profile-picker';
  wrapper.setAttribute('aria-labelledby', 'expert-profile-title');

  const heading = document.createElement('div');
  heading.className = 'field-heading';
  heading.innerHTML = '<label id="expert-profile-title" for="expert-profile">Quem deve analisar?</label><span>especialista</span>';

  const select = document.createElement('select');
  select.id = 'expert-profile';
  select.name = 'expertProfile';
  select.className = 'expert-profile-select';
  select.setAttribute('aria-describedby', 'expert-profile-description');

  for (const profile of EXPERT_PROFILES) {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = `${profile.icon} ${profile.name}`;
    select.append(option);
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  select.value = EXPERT_PROFILES.some((profile) => profile.id === stored) ? stored : 'general';

  const description = document.createElement('p');
  description.id = 'expert-profile-description';
  description.className = 'expert-profile-description';
  updateDescription(select, description);
  select.addEventListener('change', () => updateDescription(select, description));

  wrapper.append(heading, select, description);
  fieldGroup.before(wrapper);

  const repeatButton = document.getElementById('repeat-analysis');
  if (repeatButton && !document.getElementById('reanalyze-profile')) {
    const reanalyze = document.createElement('button');
    reanalyze.id = 'reanalyze-profile';
    reanalyze.className = 'secondary';
    reanalyze.type = 'button';
    reanalyze.textContent = 'Reanalisar com outro especialista';
    reanalyze.disabled = true;
    reanalyze.addEventListener('click', () => {
      select.focus();
      select.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const onChange = () => repeatButton.click();
      select.addEventListener('change', onChange, { once: true });
    });
    repeatButton.insertAdjacentElement('afterend', reanalyze);

    const observer = new MutationObserver(() => {
      reanalyze.disabled = repeatButton.disabled;
    });
    observer.observe(repeatButton, { attributes: true, attributeFilter: ['disabled'] });
  }
}

if (hasBrowserDom) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installExpertProfileSelector, { once: true });
  } else {
    installExpertProfileSelector();
  }
}

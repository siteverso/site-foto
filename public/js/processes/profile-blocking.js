const root = document.querySelector('[data-profile-actions]');

if (root) {
  const toggle = root.querySelector('[data-profile-actions-toggle]');
  const menu = root.querySelector('[data-profile-actions-menu]');
  const buttons = [...root.querySelectorAll('[data-profile-block-type]')];

  const close = () => {
    if (!menu) return;
    menu.hidden = true;
    toggle?.setAttribute('aria-expanded', 'false');
  };

  const notice = (message, kind = 'error') => {
    let element = root.querySelector('[data-profile-action-notice]');
    if (!element) {
      element = document.createElement('p');
      element.className = 'profile-action-notice';
      element.dataset.profileActionNotice = '';
      element.setAttribute('role', 'status');
      root.append(element);
    }
    element.dataset.kind = kind;
    element.textContent = message;
    element.hidden = false;
    window.clearTimeout(Number(element.dataset.timer || 0));
    element.dataset.timer = String(window.setTimeout(() => { element.hidden = true; }, 4500));
  };

  const setBusy = busy => {
    buttons.forEach(button => { button.disabled = busy; });
    root.dataset.busy = String(busy);
  };

  const stateValue = (state, type) => ({
    messages: Boolean(state.messages),
    profile_access: Boolean(state.profileAccess),
    hide_me: Boolean(state.hideMe),
    hide_them: Boolean(state.hideThem),
  })[type];

  const labels = {
    messages: ['Bloquear mensagens', 'Permitir mensagens'],
    profile_access: ['Impedir acesso ao meu perfil', 'Liberar acesso ao meu perfil'],
    hide_me: ['Ficar invisível para esta pessoa', 'Voltar a aparecer para esta pessoa'],
    hide_them: ['Não ver esta pessoa', 'Voltar a ver esta pessoa'],
  };

  const applyState = state => {
    root.querySelectorAll('[data-profile-block-indicator]').forEach(indicator => {
      indicator.hidden = !stateValue(state, indicator.dataset.profileBlockIndicator);
    });

    buttons.forEach(button => {
      const type = button.dataset.profileBlockType;
      const blocked = stateValue(state, type);
      button.dataset.blocked = String(blocked);
      const strong = button.querySelector('strong');
      if (strong) strong.textContent = labels[type]?.[blocked ? 1 : 0] || strong.textContent;
    });
  };

  toggle?.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => { if (!root.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });

  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-profile-block-type]');
    if (!button || button.disabled) return;

    const userId = Number(root.dataset.userId);
    const type = button.dataset.profileBlockType;
    const blocked = button.dataset.blocked !== 'true';
    if (!Number.isSafeInteger(userId) || userId <= 0) return notice('Não foi possível identificar o perfil.');

    const confirmations = {
      messages: blocked ? 'Bloquear as mensagens privadas entre vocês?' : 'Voltar a permitir mensagens?',
      profile_access: blocked ? 'Impedir esta pessoa de abrir e observar seu perfil?' : 'Liberar o acesso ao seu perfil?',
      hide_me: blocked ? 'Ficar invisível para esta pessoa em todo o FotoLife?' : 'Voltar a aparecer para esta pessoa?',
      hide_them: blocked ? 'Ocultar esta pessoa de tudo que você vê no FotoLife?' : 'Voltar a ver esta pessoa?',
    };
    if (!confirm(confirmations[type])) return;

    setBusy(true);
    try {
      const response = await fetch('/api/profile/block', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ userId, type, blocked }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.error || `HTTP_${response.status}`);
      applyState(payload.block || {});
      close();
      notice(blocked ? 'Restrição ativada.' : 'Restrição removida.', 'success');
      if (type === 'hide_them' && blocked) window.setTimeout(() => { location.href = '/'; }, 350);
    } catch (error) {
      console.error('profile-block:', error);
      notice(error.message === 'TIPO_BLOQUEIO_INVALIDO' ? 'A opção escolhida é inválida.' : 'Não foi possível atualizar a restrição.');
    } finally {
      setBusy(false);
    }
  });
}

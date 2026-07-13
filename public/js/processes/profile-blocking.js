const root = document.querySelector('[data-profile-actions]');

if (root) {
  const toggle = root.querySelector('[data-profile-actions-toggle]');
  const menu = root.querySelector('[data-profile-actions-menu]');
  const buttons = [...root.querySelectorAll('[data-profile-block-level]')];

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

  const applyState = state => {
    const messageButton = root.querySelector('[data-profile-block-level="messages"]');
    const allButton = root.querySelector('[data-profile-block-level="all"]');
    if (messageButton) {
      const messagesOnly = Boolean(state.messages && !state.all);
      messageButton.dataset.blocked = String(messagesOnly);
      messageButton.querySelector('strong').textContent = messagesOnly ? 'Permitir mensagens' : 'Bloquear mensagens';
      messageButton.querySelector('small').textContent = messagesOnly
        ? 'Voltar a receber mensagens deste perfil.'
        : 'Mantém o perfil visível, mas impede mensagens.';
      messageButton.hidden = Boolean(state.all);
    }
    if (allButton) {
      allButton.dataset.blocked = String(Boolean(state.all));
      allButton.querySelector('strong').textContent = state.all ? 'Desbloquear perfil' : 'Bloquear perfil';
      allButton.querySelector('small').textContent = state.all
        ? 'Permitir novamente o acesso e as interações.'
        : 'Impede acesso, observação e qualquer mensagem.';
    }
  };

  toggle?.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', event => {
    if (!root.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });

  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-profile-block-level]');
    if (!button || button.disabled) return;

    const userId = Number(root.dataset.userId);
    const level = button.dataset.profileBlockLevel;
    const blocked = button.dataset.blocked !== 'true';
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      notice('Não foi possível identificar o perfil. Atualize a página e tente novamente.');
      return;
    }

    const message = level === 'all'
      ? (blocked ? 'Bloquear completamente este perfil? Ele não poderá acessar seu perfil nem interagir com você.' : 'Desbloquear este perfil?')
      : (blocked ? 'Bloquear apenas as mensagens deste perfil?' : 'Voltar a permitir mensagens deste perfil?');
    if (!confirm(message)) return;

    setBusy(true);
    try {
      const response = await fetch('/api/profile/block', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ userId, level, blocked }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.error || `HTTP_${response.status}`);

      applyState(payload.block || { all: false, messages: false });
      close();
      notice(blocked ? 'Bloqueio atualizado.' : 'Bloqueio removido.', 'success');

      if (level === 'all' && blocked) {
        window.setTimeout(() => { location.href = '/'; }, 350);
      }
    } catch (error) {
      console.error('profile-block:', error);
      const codes = {
        USUARIO_ALVO_INVALIDO: 'O perfil selecionado é inválido.',
        USUARIO_ALVO_NAO_ENCONTRADO: 'Este perfil não está mais disponível.',
        NIVEL_BLOQUEIO_INVALIDO: 'O nível de bloqueio é inválido.',
        ESTADO_BLOQUEIO_INVALIDO: 'O estado do bloqueio é inválido.',
        NAO_AUTENTICADO: 'Sua sessão expirou. Entre novamente.',
        ERRO_INTERNO: 'Não foi possível atualizar o bloqueio. Confira se o patch do banco foi executado.',
      };
      notice(codes[error.message] || 'Não foi possível atualizar o bloqueio.');
    } finally {
      setBusy(false);
    }
  });
}

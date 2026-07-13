const root = document.querySelector('[data-profile-actions]');
if (root) {
  const toggle = root.querySelector('[data-profile-actions-toggle]');
  const menu = root.querySelector('[data-profile-actions-menu]');
  const close = () => { if (!menu) return; menu.hidden = true; toggle?.setAttribute('aria-expanded', 'false'); };
  toggle?.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('click', event => { if (!root.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-profile-block-level]');
    if (!button || button.disabled) return;
    const level = button.dataset.profileBlockLevel;
    const blocked = button.dataset.blocked !== 'true';
    const message = level === 'all'
      ? (blocked ? 'Bloquear completamente este perfil? Ele não poderá acessar seu perfil nem interagir com você.' : 'Desbloquear este perfil?')
      : (blocked ? 'Bloquear apenas as mensagens deste perfil?' : 'Voltar a permitir mensagens deste perfil?');
    if (!confirm(message)) return;
    button.disabled = true;
    try {
      const response = await fetch('/api/profile/block', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: Number(root.dataset.userId), level, blocked }) });
      if (!response.ok) throw new Error();
      if (level === 'all' && blocked) { location.href = '/'; return; }
      location.reload();
    } catch { button.disabled = false; alert('Não foi possível atualizar o bloqueio.'); }
  });
}

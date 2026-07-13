type MessageCard = HTMLElement & {
  dataset: DOMStringMap & {
    messageId?: string;
    deleteQuestion?: string;
    confirmDeletion?: string;
    cancelDeletion?: string;
    operationError?: string;
  };
};

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const restoreActions = (actions: HTMLElement): void => {
  const original = actions.dataset.originalMarkup;
  if (original) actions.innerHTML = original;
};

const showConfirmation = (card: MessageCard, actions: HTMLElement): void => {
  if (!actions.dataset.originalMarkup) actions.dataset.originalMarkup = actions.innerHTML;

  const question = escapeHtml(card.dataset.deleteQuestion || 'Excluir?');
  const confirmLabel = escapeHtml(card.dataset.confirmDeletion || 'Confirmar exclusão');
  const cancelLabel = escapeHtml(card.dataset.cancelDeletion || 'Cancelar exclusão');

  actions.innerHTML = `
    <span class="received-message-delete-question">${question}</span>
    <button class="received-message-confirm" type="button" data-received-message-confirm aria-label="${confirmLabel}">✓</button>
    <button class="received-message-cancel" type="button" data-received-message-cancel aria-label="${cancelLabel}">×</button>`;
};

const deleteMessage = async (card: MessageCard, actions: HTMLElement): Promise<void> => {
  const id = Number(card.dataset.messageId || 0);
  if (!id) return;

  const confirmButton = actions.querySelector<HTMLButtonElement>('[data-received-message-confirm]');
  if (confirmButton) confirmButton.disabled = true;

  try {
    const response = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || card.dataset.operationError || 'Não foi possível excluir.');
    }

    card.remove();
    document.dispatchEvent(new CustomEvent('received-photo-message:deleted', { detail: { id } }));
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : (card.dataset.operationError || 'Não foi possível excluir.');
    actions.innerHTML = `<span class="received-message-delete-error">${escapeHtml(message)}</span>`;
  }
};

const handleClick = (event: MouseEvent): void => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const card = target.closest<MessageCard>('[data-received-message-card]');
  if (!card) return;

  const actions = card.querySelector<HTMLElement>('[data-received-message-actions]');
  if (!actions) return;

  if (target.closest('[data-received-message-delete]')) {
    showConfirmation(card, actions);
    return;
  }

  if (target.closest('[data-received-message-cancel]')) {
    restoreActions(actions);
    return;
  }

  if (target.closest('[data-received-message-confirm]')) {
    void deleteMessage(card, actions);
  }
};

if (!document.documentElement.dataset.receivedPhotoMessageCardReady) {
  document.documentElement.dataset.receivedPhotoMessageCardReady = 'true';
  document.addEventListener('click', handleClick);
}

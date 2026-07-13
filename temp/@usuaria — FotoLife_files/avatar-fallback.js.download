function avatarFallbackFor(image) {
  const container = image.closest('[data-avatar-container], [data-user-avatar]') || image.parentElement;
  return container?.querySelector('[data-avatar-fallback]') || null;
}

function showAvatarInitials(image) {
  if (!(image instanceof HTMLImageElement) || !image.matches('[data-avatar-image]')) return;
  image.hidden = true;
  image.removeAttribute('src');
  image.removeAttribute('srcset');
  const fallback = avatarFallbackFor(image);
  if (fallback instanceof HTMLElement) fallback.hidden = false;
}

function prepareAvatar(image) {
  if (!(image instanceof HTMLImageElement) || !image.matches('[data-avatar-image]')) return;
  if (image.dataset.avatarFallbackPrepared === 'true') return;
  image.dataset.avatarFallbackPrepared = 'true';
  image.addEventListener('load', () => {
    image.hidden = false;
    const fallback = avatarFallbackFor(image);
    if (fallback instanceof HTMLElement) fallback.hidden = true;
  });
  image.addEventListener('error', () => showAvatarInitials(image));
  if (image.complete && image.naturalWidth === 0) showAvatarInitials(image);
}

document.querySelectorAll('[data-avatar-image]').forEach(prepareAvatar);
document.addEventListener('error', event => prepareAvatar(event.target), true);
new MutationObserver(records => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches('[data-avatar-image]')) prepareAvatar(node);
      node.querySelectorAll?.('[data-avatar-image]').forEach(prepareAvatar);
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true });

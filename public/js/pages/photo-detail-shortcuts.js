/**
 * Atalho exclusivo da página individual da foto.
 * Esc sempre abre diretamente o perfil do proprietário da foto.
 */
const page = document.querySelector('[data-photo-owner-profile]');

if (page instanceof HTMLElement) {
  const profileUrl = page.dataset.photoOwnerProfile;

  if (profileUrl) {
    window.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(profileUrl);
    }, { capture: true });
  }
}

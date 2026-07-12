const $ = (selector, root = document) => root?.querySelector(selector) ?? null;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
let activeCropperCleanup = null;

function setMessage(element, text = '', type = 'info') {
  if (!element) return;
  element.textContent = text;
  element.dataset.type = type;
  element.hidden = !text;
}

function setLoading(button, loading, text = 'Salvando…') {
  if (!button) return;
  if (loading) {
    if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent || '';
    button.textContent = text;
    button.disabled = true;
    return;
  }
  button.textContent = button.dataset.originalLabel || button.textContent;
  button.disabled = false;
  delete button.dataset.originalLabel;
}

function closeCropper({ clearInput = false } = {}) {
  activeCropperCleanup?.({ clearInput });
  activeCropperCleanup = null;
}

async function uploadAvatar(blob, message) {
  const formData = new FormData();
  formData.append('avatar', blob, 'avatar.jpg');
  const response = await fetch('/api/auth/avatar', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar a foto.');
  setMessage(message, 'Foto atualizada.', 'success');
  window.setTimeout(() => location.reload(), 250);
}

function openCropper(file, message, input) {
  closeCropper({ clearInput: true });

  const objectUrl = URL.createObjectURL(file);
  const backdrop = document.createElement('div');
  backdrop.className = 'avatar-crop-backdrop';
  backdrop.dataset.avatarCropModal = '';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-labelledby', 'avatarCropTitle');
  backdrop.innerHTML = `
    <section class="avatar-crop-card" data-avatar-crop-card>
      <button class="avatar-crop-close" type="button" data-avatar-crop-close aria-label="Fechar">×</button>
      <h2 id="avatarCropTitle">Posicionar foto</h2>
      <p class="avatar-crop-subtitle">Arraste para enquadrar. Use a roda do mouse ou o controle para aproximar.</p>
      <div class="avatar-crop-stage" data-avatar-crop-stage>
        <img src="${objectUrl}" alt="Imagem escolhida para recorte" draggable="false" data-avatar-crop-image>
        <span class="avatar-crop-mask" aria-hidden="true"></span>
      </div>
      <label class="avatar-crop-zoom">
        <span>Zoom</span>
        <input type="range" min="1" max="3" value="1" step="0.01" data-avatar-crop-zoom>
      </label>
      <div class="avatar-crop-actions">
        <button class="button secondary" type="button" data-avatar-crop-close>Cancelar</button>
        <button class="button primary" type="button" data-avatar-crop-confirm>Usar esta foto</button>
      </div>
    </section>`;

  document.body.append(backdrop);
  document.documentElement.classList.add('dialog-open');

  const stage = $('[data-avatar-crop-stage]', backdrop);
  const image = $('[data-avatar-crop-image]', backdrop);
  const zoomInput = $('[data-avatar-crop-zoom]', backdrop);
  const confirm = $('[data-avatar-crop-confirm]', backdrop);
  const closeButton = $('[data-avatar-crop-close]', backdrop);

  if (!stage || !image || !zoomInput || !confirm || !closeButton) {
    URL.revokeObjectURL(objectUrl);
    backdrop.remove();
    document.documentElement.classList.remove('dialog-open');
    setMessage(message, 'Não foi possível abrir o recorte.', 'error');
    input.value = '';
    return;
  }

  const state = { x: 0, y: 0, zoom: 1, baseScale: 1, dragging: false, pointerX: 0, pointerY: 0 };
  const stageSize = () => Math.max(1, stage.clientWidth);

  const clamp = () => {
    const size = stageSize();
    const width = image.naturalWidth * state.baseScale * state.zoom;
    const height = image.naturalHeight * state.baseScale * state.zoom;
    state.x = Math.max((size - width) / 2, Math.min((width - size) / 2, state.x));
    state.y = Math.max((size - height) / 2, Math.min((height - size) / 2, state.y));
  };

  const render = () => {
    if (!image.naturalWidth) return;
    clamp();
    image.style.transform = `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px)) scale(${state.baseScale * state.zoom})`;
  };

  const initialize = () => {
    state.x = 0;
    state.y = 0;
    state.baseScale = Math.max(stageSize() / image.naturalWidth, stageSize() / image.naturalHeight);
    render();
  };

  const setZoom = value => {
    state.zoom = Math.max(Number(zoomInput.min), Math.min(Number(zoomInput.max), value));
    zoomInput.value = state.zoom.toFixed(2);
    render();
  };

  const onResize = () => {
    if (!image.naturalWidth) return;
    const previousScale = state.baseScale;
    state.baseScale = Math.max(stageSize() / image.naturalWidth, stageSize() / image.naturalHeight);
    if (previousScale > 0) {
      state.x *= state.baseScale / previousScale;
      state.y *= state.baseScale / previousScale;
    }
    render();
  };

  const onEscape = event => {
    if (event.key === 'Escape') closeCropper({ clearInput: true });
  };

  activeCropperCleanup = ({ clearInput = false } = {}) => {
    window.removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onEscape);
    URL.revokeObjectURL(objectUrl);
    backdrop.remove();
    document.documentElement.classList.remove('dialog-open');
    if (clearInput) input.value = '';
  };

  if (image.complete && image.naturalWidth) initialize();
  else image.addEventListener('load', initialize, { once: true });

  zoomInput.addEventListener('input', () => setZoom(Number(zoomInput.value)));
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    setZoom(state.zoom + (event.deltaY < 0 ? 0.08 : -0.08));
  }, { passive: false });

  stage.addEventListener('pointerdown', event => {
    state.dragging = true;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });

  stage.addEventListener('pointermove', event => {
    if (!state.dragging) return;
    state.x += event.clientX - state.pointerX;
    state.y += event.clientY - state.pointerY;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    render();
  });

  const stopDragging = event => {
    state.dragging = false;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  };

  stage.addEventListener('pointerup', stopDragging);
  stage.addEventListener('pointercancel', stopDragging);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('keydown', onEscape);

  backdrop.addEventListener('click', event => {
    if (event.target === backdrop || event.target.closest('[data-avatar-crop-close]')) {
      closeCropper({ clearInput: true });
    }
  });

  confirm.addEventListener('click', async () => {
    setLoading(confirm, true);
    try {
      if (!image.naturalWidth) throw new Error('A imagem ainda não terminou de carregar.');
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível preparar a imagem.');

      const size = stageSize();
      const scale = state.baseScale * state.zoom;
      const displayedWidth = image.naturalWidth * scale;
      const displayedHeight = image.naturalHeight * scale;
      const left = (size - displayedWidth) / 2 + state.x;
      const top = (size - displayedHeight) / 2 + state.y;

      context.drawImage(
        image,
        Math.max(0, -left / scale),
        Math.max(0, -top / scale),
        Math.min(image.naturalWidth, size / scale),
        Math.min(image.naturalHeight, size / scale),
        0,
        0,
        512,
        512,
      );

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Não foi possível recortar a imagem.');
      await uploadAvatar(blob, message);
      closeCropper();
    } catch (error) {
      setMessage(message, error instanceof Error ? error.message : 'Não foi possível atualizar a foto.', 'error');
      setLoading(confirm, false);
    }
  });

  closeButton.focus({ preventScroll: true });
}

function bindAvatarEditor() {
  const form = $('[data-avatar-form]');
  const input = $('[data-avatar-input]', form);
  const trigger = $('[data-avatar-trigger]');
  if (!form || !input || !trigger || input.dataset.bound === 'true') return;

  input.dataset.bound = 'true';
  trigger.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const message = $('[data-form-message]', form);
    setMessage(message);

    if (!ALLOWED_TYPES.has(file.type)) {
      setMessage(message, 'Escolha uma imagem JPG, PNG ou WebP.', 'error');
      input.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setMessage(message, 'A imagem deve ter no máximo 3 MB.', 'error');
      input.value = '';
      return;
    }
    openCropper(file, message, input);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindAvatarEditor, { once: true });
} else {
  bindAvatarEditor();
}

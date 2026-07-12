const dialog = document.querySelector("[data-photo-lightbox]");
const trigger = document.querySelector("[data-open-photo-lightbox]");
const shell = dialog?.querySelector("[data-photo-lightbox-shell]");
const closeButton = dialog?.querySelector("[data-photo-lightbox-close]");
const fullscreenButton = dialog?.querySelector("[data-photo-fullscreen]");

function openLightbox() {
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (!dialog.open) dialog.showModal();
  document.documentElement.classList.add("photo-lightbox-open");
  closeButton?.focus();
}

function closeLightbox() {
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  if (document.fullscreenElement) void document.exitFullscreen();
  dialog.close();
}

trigger?.addEventListener("click", openLightbox);
trigger?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openLightbox();
  }
});

closeButton?.addEventListener("click", closeLightbox);
dialog?.addEventListener("close", () => document.documentElement.classList.remove("photo-lightbox-open"));
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closeLightbox();
});

fullscreenButton?.addEventListener("click", async () => {
  if (!(shell instanceof HTMLElement)) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen();
  } catch {
    // O navegador pode bloquear tela cheia; o visualizador continua aberto normalmente.
  }
});

document.addEventListener("keydown", (event) => {
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") dialog.querySelector("[data-photo-previous]")?.click();
  if (event.key === "ArrowRight") dialog.querySelector("[data-photo-next]")?.click();
});

if (new URLSearchParams(window.location.search).get("viewer") === "1") openLightbox();

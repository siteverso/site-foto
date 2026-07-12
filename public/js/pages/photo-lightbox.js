const dialog = document.querySelector("[data-photo-lightbox]");
const trigger = document.querySelector("[data-open-photo-lightbox]");
const shell = dialog?.querySelector("[data-photo-lightbox-shell]");
const closeButton = dialog?.querySelector("[data-photo-lightbox-close]");
const fullscreenButton = dialog?.querySelector("[data-photo-fullscreen]");
const previousLink = dialog?.querySelector("[data-photo-previous]");
const nextLink = dialog?.querySelector("[data-photo-next]");
const slideshowButton = dialog?.querySelector("[data-slideshow-toggle]");
const slideshowText = dialog?.querySelector("[data-slideshow-text]");
const slideshowIcon = dialog?.querySelector("[data-slideshow-icon]");
const intervalSelect = dialog?.querySelector("[data-slideshow-interval]");
const effectSelect = dialog?.querySelector("[data-slideshow-effect]");
const loopToggle = dialog?.querySelector("[data-slideshow-loop]");
const image = dialog?.querySelector("[data-photo-lightbox-image]");

const STORAGE_KEY = "fotolife-photo-viewer";
let slideshowTimer = null;
let slideshowRunning = false;

function readPreferences() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function savePreferences(values) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readPreferences(), ...values }));
}

function getMode() {
  return readPreferences().mode === "global" ? "global" : "profile";
}

function isLoopEnabled() {
  return loopToggle instanceof HTMLInputElement ? loopToggle.checked : true;
}

function getScopedNavigationId(edge) {
  if (!(dialog instanceof HTMLElement)) return "";
  return dialog.dataset[`${getMode()}${edge}`] || "";
}

function buildPhotoUrl(id) {
  const params = new URLSearchParams({ viewer: "1", nav: getMode() });
  if (slideshowRunning) params.set("slideshow", "1");
  if (isLoopEnabled()) params.set("loop", "1");
  params.set("effect", effectSelect?.value || "fade");
  return `/foto/${id}?${params.toString()}`;
}

function setLinkState(link, id) {
  if (!(link instanceof HTMLAnchorElement)) return;
  if (id) {
    link.href = buildPhotoUrl(id);
    link.removeAttribute("aria-disabled");
    link.tabIndex = 0;
  } else {
    link.href = "#";
    link.setAttribute("aria-disabled", "true");
    link.tabIndex = -1;
  }
}

function applyNavigationMode(mode) {
  if (!(dialog instanceof HTMLElement)) return;
  const normalized = mode === "global" ? "global" : "profile";
  savePreferences({ mode: normalized });
  dialog.querySelectorAll("[data-navigation-mode]").forEach(button => {
    const active = button.getAttribute("data-navigation-mode") === normalized;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  setLinkState(previousLink, dialog.dataset[`${normalized}Previous`] || "");
  setLinkState(nextLink, dialog.dataset[`${normalized}Next`] || "");
}

function applyEffect(effect) {
  if (!(image instanceof HTMLElement)) return;
  image.classList.remove("effect-fade", "effect-slide", "effect-zoom", "effect-dissolve");
  image.classList.add(`effect-${effect}`);
}

function openLightbox() {
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (!dialog.open) dialog.showModal();
  document.documentElement.classList.add("photo-lightbox-open");
  closeButton?.focus();
}

function stopSlideshow() {
  slideshowRunning = false;
  if (slideshowTimer) window.clearTimeout(slideshowTimer);
  slideshowTimer = null;
  if (slideshowText) slideshowText.textContent = dialog?.dataset.slideshowLabel || "Slideshow";
  if (slideshowIcon) slideshowIcon.textContent = "▶";
}

function getNextSlideshowHref() {
  if (nextLink instanceof HTMLAnchorElement && nextLink.getAttribute("aria-disabled") !== "true") {
    return nextLink.href;
  }
  if (!isLoopEnabled()) return null;
  const firstId = getScopedNavigationId("First");
  return firstId ? buildPhotoUrl(firstId) : null;
}

function scheduleNext() {
  if (!slideshowRunning) {
    stopSlideshow();
    return;
  }
  const nextHref = getNextSlideshowHref();
  if (!nextHref) {
    stopSlideshow();
    return;
  }
  const delay = Number(intervalSelect?.value || 5000);
  slideshowTimer = window.setTimeout(() => { window.location.href = nextHref; }, delay);
}

function startSlideshow() {
  slideshowRunning = true;
  if (slideshowText) slideshowText.textContent = dialog?.dataset.pauseLabel || "Pause";
  if (slideshowIcon) slideshowIcon.textContent = "❚❚";
  savePreferences({ interval: intervalSelect?.value, effect: effectSelect?.value, loop: isLoopEnabled() });
  applyNavigationMode(getMode());
  scheduleNext();
}

function closeLightbox() {
  stopSlideshow();
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  if (document.fullscreenElement) void document.exitFullscreen();
  dialog.close();
}

trigger?.addEventListener("click", openLightbox);
trigger?.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLightbox(); }
});
closeButton?.addEventListener("click", closeLightbox);
dialog?.addEventListener("close", () => document.documentElement.classList.remove("photo-lightbox-open"));
dialog?.addEventListener("click", event => { if (event.target === dialog) closeLightbox(); });

fullscreenButton?.addEventListener("click", async () => {
  if (!(shell instanceof HTMLElement)) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen();
  } catch { /* visualizador segue funcional sem fullscreen */ }
});

dialog?.querySelectorAll("[data-navigation-mode]").forEach(button => {
  button.addEventListener("click", () => { stopSlideshow(); applyNavigationMode(button.dataset.navigationMode); });
});
[previousLink, nextLink].forEach(link => link?.addEventListener("click", event => {
  if (link.getAttribute("aria-disabled") === "true") event.preventDefault();
  else if (!slideshowRunning) stopSlideshow();
}));

slideshowButton?.addEventListener("click", () => slideshowRunning ? stopSlideshow() : startSlideshow());
intervalSelect?.addEventListener("change", () => {
  savePreferences({ interval: intervalSelect.value });
  if (slideshowRunning) { if (slideshowTimer) clearTimeout(slideshowTimer); scheduleNext(); }
});
effectSelect?.addEventListener("change", () => { savePreferences({ effect: effectSelect.value }); applyEffect(effectSelect.value); });
loopToggle?.addEventListener("change", () => {
  savePreferences({ loop: isLoopEnabled() });
  if (slideshowRunning) {
    if (slideshowTimer) clearTimeout(slideshowTimer);
    scheduleNext();
  }
});

document.addEventListener("keydown", event => {
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") previousLink?.click();
  if (event.key === "ArrowRight") nextLink?.click();
  if (event.key === " ") { event.preventDefault(); slideshowButton?.click(); }
});

const preferences = readPreferences();
const urlParams = new URLSearchParams(location.search);
if (intervalSelect && preferences.interval) intervalSelect.value = preferences.interval;
if (effectSelect) effectSelect.value = urlParams.get("effect") || preferences.effect || "fade";
if (loopToggle instanceof HTMLInputElement) {
  loopToggle.checked = urlParams.get("loop") === "1" || preferences.loop !== false;
}
applyEffect(effectSelect?.value || "fade");
applyNavigationMode(urlParams.get("nav") || getMode());
if (urlParams.get("viewer") === "1") openLightbox();
if (urlParams.get("slideshow") === "1") startSlideshow();

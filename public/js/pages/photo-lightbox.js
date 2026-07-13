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
const loopToggle = dialog?.querySelector("[data-slideshow-loop]");
const image = dialog?.querySelector("[data-photo-lightbox-image]");
const caption = dialog?.querySelector(".photo-lightbox-caption");
const watermark = dialog?.querySelector(".photo-lightbox-watermark");

const STORAGE_KEY = "fotolife-photo-viewer";
let slideshowTimer = null;
let slideshowRunning = false;
let navigationPending = false;

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

function waitForImage(src) {
  return new Promise((resolve, reject) => {
    const loader = new Image();
    loader.onload = () => resolve(src);
    loader.onerror = reject;
    loader.src = src;
  });
}

async function loadPhotoView(href) {
  const response = await fetch(href, { headers: { "X-Photo-Lightbox": "1" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const documentSnapshot = new DOMParser().parseFromString(html, "text/html");
  const nextDialog = documentSnapshot.querySelector("[data-photo-lightbox]");
  const nextImage = nextDialog?.querySelector("[data-photo-lightbox-image]");
  if (!(nextDialog instanceof HTMLElement) || !(nextImage instanceof HTMLImageElement)) {
    throw new Error("Invalid photo lightbox response");
  }
  await waitForImage(nextImage.src);
  return { nextDialog, nextImage };
}

function copyViewerState(nextDialog, nextImage) {
  if (!(dialog instanceof HTMLElement) || !(image instanceof HTMLImageElement)) return;
  [
    "globalPrevious", "globalNext", "globalFirst", "globalLast",
    "profilePrevious", "profileNext", "profileFirst", "profileLast"
  ].forEach(key => { dialog.dataset[key] = nextDialog.dataset[key] || ""; });

  image.src = nextImage.src;
  image.alt = nextImage.alt;
  dialog.setAttribute("aria-label", nextDialog.getAttribute("aria-label") || nextImage.alt);

  const nextCaption = nextDialog.querySelector(".photo-lightbox-caption");
  const nextWatermark = nextDialog.querySelector(".photo-lightbox-watermark");
  if (caption instanceof HTMLElement) {
    if (nextCaption instanceof HTMLElement) {
      caption.innerHTML = nextCaption.innerHTML;
      caption.hidden = false;
    } else {
      caption.innerHTML = "";
      caption.hidden = true;
    }
  }
  if (watermark instanceof HTMLAnchorElement && nextWatermark instanceof HTMLAnchorElement) {
    watermark.textContent = nextWatermark.textContent;
    watermark.href = nextWatermark.href;
    watermark.setAttribute("aria-label", nextWatermark.getAttribute("aria-label") || nextWatermark.textContent || "");
    watermark.title = nextWatermark.title;
  }
  applyNavigationMode(getMode());
}

async function navigatePhoto(href, { replaceHistory = false } = {}) {
  if (!href || navigationPending) return;
  if (!(image instanceof HTMLImageElement)) {
    window.location.assign(href);
    return;
  }

  navigationPending = true;
  if (slideshowTimer) window.clearTimeout(slideshowTimer);
  slideshowTimer = null;
  shell?.classList.add("is-loading-photo");

  try {
    const { nextDialog, nextImage } = await loadPhotoView(href);
    copyViewerState(nextDialog, nextImage);

    const targetUrl = new URL(href, location.href);
    if (replaceHistory) history.replaceState({ photoLightbox: true }, "", targetUrl);
    else history.pushState({ photoLightbox: true }, "", targetUrl);
  } catch {
    window.location.assign(href);
    return;
  } finally {
    navigationPending = false;
    shell?.classList.remove("is-loading-photo");
    if (slideshowRunning) scheduleNext();
  }
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
  if (!slideshowRunning || navigationPending) return;
  const nextHref = getNextSlideshowHref();
  if (!nextHref) {
    stopSlideshow();
    return;
  }
  const delay = Number(intervalSelect?.value || 5000);
  slideshowTimer = window.setTimeout(() => navigatePhoto(nextHref), delay);
}

function startSlideshow() {
  slideshowRunning = true;
  if (slideshowText) slideshowText.textContent = dialog?.dataset.pauseLabel || "Pause";
  if (slideshowIcon) slideshowIcon.textContent = "❚❚";
  savePreferences({ interval: intervalSelect?.value, loop: isLoopEnabled() });
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
previousLink?.addEventListener("click", event => {
  event.preventDefault();
  if (previousLink.getAttribute("aria-disabled") === "true") return;
  if (!slideshowRunning) stopSlideshow();
  void navigatePhoto(previousLink.href);
});
nextLink?.addEventListener("click", event => {
  event.preventDefault();
  if (nextLink.getAttribute("aria-disabled") === "true") return;
  if (!slideshowRunning) stopSlideshow();
  void navigatePhoto(nextLink.href);
});

slideshowButton?.addEventListener("click", () => slideshowRunning ? stopSlideshow() : startSlideshow());
intervalSelect?.addEventListener("change", () => {
  savePreferences({ interval: intervalSelect.value });
  if (slideshowRunning) { if (slideshowTimer) clearTimeout(slideshowTimer); scheduleNext(); }
});
loopToggle?.addEventListener("change", () => {
  savePreferences({ loop: isLoopEnabled() });
  if (slideshowRunning) {
    if (slideshowTimer) clearTimeout(slideshowTimer);
    scheduleNext();
  }
});

document.addEventListener("keydown", event => {
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open || navigationPending) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") previousLink?.click();
  if (event.key === "ArrowRight") nextLink?.click();
  if (event.key === " ") { event.preventDefault(); slideshowButton?.click(); }
});

window.addEventListener("popstate", () => {
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  void navigatePhoto(location.href, { replaceHistory: true });
});

const preferences = readPreferences();
const urlParams = new URLSearchParams(location.search);
if (intervalSelect && preferences.interval) intervalSelect.value = preferences.interval;
if (loopToggle instanceof HTMLInputElement) {
  loopToggle.checked = urlParams.get("loop") === "1" || preferences.loop !== false;
}
applyNavigationMode(urlParams.get("nav") || getMode());
if (urlParams.get("viewer") === "1") openLightbox();
if (urlParams.get("slideshow") === "1") startSlideshow();

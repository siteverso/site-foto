import { readJsonConfig } from '../core/dom.js';

const clientMessages = readJsonConfig('profile-client-messages');

const postDialog = document.querySelector("[data-post-dialog]");
const postForm = document.querySelector("[data-photo-form]");
const input = document.querySelector("[data-photo-input]");
const preview = document.querySelector("[data-photo-preview]");
const label = document.querySelector("[data-photo-label]");
const progress = document.querySelector("[data-upload-progress]");
const status = document.querySelector("[data-upload-status]");
const percent = document.querySelector("[data-upload-percent]");
const fill = document.querySelector("[data-upload-fill]");
const publishButton = document.querySelector("[data-publish-button]");
const postMessage = document.querySelector("[data-post-message]");
let previewUrl = "";
let uploadToken = "";
let uploadPromise = null;
let activeUpload = null;
let previewReady = false;
let isPublishing = false;
const updatePublishAvailability = () => {
  if (publishButton) publishButton.disabled = isPublishing || !previewReady;
};
const showPostMessage = (message = "", type = "error") => {
  if (!postMessage) return;
  postMessage.textContent = message;
  postMessage.dataset.type = type;
  postMessage.hidden = !message;
};
const responseError = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    return String(data.error || clientMessages.operationError);
  }
  return await response.text() || clientMessages.operationError;
};
const setPostDialogOpen = (open) => {
  if (!postDialog || !open && isPublishing) return;
  postDialog.hidden = !open;
  postDialog.classList.remove("is-closing");
  document.documentElement.classList.toggle("dialog-open", open);
};
const preloadPublishedPhoto = async (photoId) => {
  if (!Number.isInteger(photoId) || photoId <= 0) throw new Error(clientMessages.loadConfirmationError);
  const image = new Image();
  image.decoding = "async";
  image.src = `/api/photos/${photoId}?published=${Date.now()}`;
  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(clientMessages.imageStillLoading));
  });
  if (typeof image.decode === "function") await image.decode().catch(() => void 0);
};
const fadeOutPublishedDialog = async () => {
  if (!postDialog) return;
  postDialog.classList.add("is-closing");
  await new Promise((resolve) => window.setTimeout(resolve, 420));
};
document.querySelector("[data-open-post-dialog]")?.addEventListener("click", () => setPostDialogOpen(true));
document.querySelectorAll("[data-close-post-dialog]").forEach((element) => element.addEventListener("click", () => setPostDialogOpen(false)));
function stagePhoto(file) {
  activeUpload?.abort();
  uploadToken = "";
  showPostMessage();
  updatePublishAvailability();
  progress?.removeAttribute("hidden");
  if (status) status.textContent = clientMessages.uploading;
  if (percent) percent.textContent = "0%";
  if (fill) fill.style.width = "0%";
  uploadPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    activeUpload = xhr;
    const data = new FormData();
    data.append("photo", file);
    xhr.open("POST", "/api/photos/stage");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const value = Math.round(event.loaded / event.total * 100);
      if (percent) percent.textContent = `${value}%`;
      if (fill) fill.style.width = `${value}%`;
    };
    xhr.upload.onload = () => {
      if (status) status.textContent = postForm?.dataset.processingText || clientMessages.processing;
    };
    xhr.onload = () => {
      activeUpload = null;
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || clientMessages.uploadError));
        return;
      }
      try {
        const responseData = JSON.parse(xhr.responseText);
        uploadToken = String(responseData.uploadToken || "");
        if (!uploadToken) throw new Error(clientMessages.uploadError);
        if (status) status.textContent = clientMessages.imageReady;
        if (percent) percent.textContent = "100%";
        if (fill) fill.style.width = "100%";
        updatePublishAvailability();
        resolve(uploadToken);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(clientMessages.uploadError));
      }
    };
    xhr.onerror = () => {
      activeUpload = null;
      reject(new Error(clientMessages.uploadError));
    };
    xhr.onabort = () => reject(new Error(clientMessages.uploadReplaced));
    xhr.send(data);
  });
  uploadPromise.catch((error) => {
    if (activeUpload) return;
    uploadToken = "";
    if (status) status.textContent = clientMessages.uploadFailed;
    updatePublishAvailability();
    if (error.message !== clientMessages.uploadReplaced) showPostMessage(error.message);
  });
  return uploadPromise;
}
input?.addEventListener("change", () => {
  const file = input.files?.[0];
  previewReady = false;
  uploadToken = "";
  updatePublishAvailability();
  if (!file || !file.type.startsWith("image/") || !preview) {
    showPostMessage("Escolha um arquivo de imagem v\xE1lido.");
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.onload = () => {
    previewReady = true;
    updatePublishAvailability();
  };
  preview.onerror = () => {
    previewReady = false;
    uploadToken = "";
    activeUpload?.abort();
    updatePublishAvailability();
    showPostMessage("N\xE3o foi poss\xEDvel carregar a imagem selecionada.");
  };
  preview.src = previewUrl;
  preview.hidden = false;
  if (label) label.hidden = true;
  stagePhoto(file);
});
postForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (publishButton) publishButton.disabled = true;
  try {
    if (!previewReady) throw new Error(clientMessages.waitImage);
    const pendingUpload = uploadPromise;
    if (!pendingUpload && !uploadToken) throw new Error(clientMessages.waitImage);
    const token = uploadToken || await pendingUpload;
    if (!token || !previewReady) throw new Error(clientMessages.waitImage);
    if (status) status.textContent = clientMessages.publishing;
    const caption = String(new FormData(postForm).get("caption") || "");
    isPublishing = true;
    postDialog?.classList.add("is-finalizing");
    postDialog?.setAttribute("aria-busy", "true");
    if (status) status.textContent = clientMessages.publishingPhoto;
    if (percent) percent.textContent = "100%";
    if (fill) fill.style.width = "100%";
    const response = await fetch("/api/photos/today", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadToken: token, caption })
    });
    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        throw new Error(String(data.error || clientMessages.temporaryLimit));
      }
      throw new Error(await responseError(response));
    }
    const result = await response.json();
    if (status) status.textContent = clientMessages.loadingProfile;
    postDialog?.classList.add("is-loading-published-photo");
    await preloadPublishedPhoto(Number(result.photoId || 0));
    if (status) status.textContent = clientMessages.photoPublished;
    postDialog?.classList.remove("is-loading-published-photo");
    postDialog?.classList.add("is-published");
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    await fadeOutPublishedDialog();
    location.reload();
  } catch (error) {
    isPublishing = false;
    postDialog?.classList.remove("is-finalizing", "is-loading-published-photo", "is-published", "is-closing");
    postDialog?.removeAttribute("aria-busy");
    if (status) status.textContent = clientMessages.imageReady;
    showPostMessage(error instanceof Error ? error.message : "N\xE3o foi poss\xEDvel publicar.");
    updatePublishAvailability();
  }
});

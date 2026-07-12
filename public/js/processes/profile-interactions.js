import { readJsonConfig } from '../core/dom.js';

const clientMessages = readJsonConfig('profile-client-messages');

const avatarDialog = document.querySelector("[data-avatar-dialog]");
const setAvatarDialogOpen = (open) => {
  if (!avatarDialog) return;
  avatarDialog.hidden = !open;
  document.documentElement.classList.toggle("has-open-dialog", open);
  if (open) avatarDialog.querySelector("[data-close-avatar-dialog]")?.focus();
};
document.querySelector("[data-open-avatar-dialog]")?.addEventListener("click", () => setAvatarDialogOpen(true));
document.querySelectorAll("[data-close-avatar-dialog]").forEach((button) => {
  button.addEventListener("click", () => setAvatarDialogOpen(false));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && avatarDialog && !avatarDialog.hidden) setAvatarDialogOpen(false);
});
document.querySelector("[data-friend-toggle]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const userId = button.dataset.userId;
  if (!userId || button.disabled) return;
  button.disabled = true;
  const method = button.dataset.observing === "true" ? "DELETE" : "POST";
  const response = await fetch(`/api/friends/${userId}`, { method });
  if (response.ok) location.reload();
  else {
    button.disabled = false;
    alert(await response.text());
  }
});
document.addEventListener("click", async (event) => {
  const removeFriendButton = event.target.closest("[data-remove-friend]");
  if (removeFriendButton) {
    const userId = removeFriendButton.dataset.userId;
    if (!userId || removeFriendButton.disabled) return;
    removeFriendButton.disabled = true;
    const response2 = await fetch(`/api/friends/${userId}`, { method: "DELETE" });
    if (!response2.ok) {
      removeFriendButton.disabled = false;
      alert(await response2.text());
      return;
    }
    document.querySelectorAll(`[data-observed-user-id="${CSS.escape(userId)}"]`).forEach((card) => card.remove());
    const section = document.querySelector("[data-profile-observed]");
    const grid = section?.querySelector("[data-live-list]");
    if (section && grid && !grid.querySelector("[data-observed-user-id]")) {
      grid.remove();
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = section.dataset.emptyMessage || clientMessages.noObserved;
      section.append(empty);
    }
    return;
  }
  const editCaptionButton = event.target.closest("[data-edit-caption]");
  if (editCaptionButton) {
    openCaptionEditor(editCaptionButton.closest("[data-daily-photo]"));
    return;
  }
  const cancelCaptionButton = event.target.closest("[data-cancel-caption]");
  if (cancelCaptionButton) {
    const form = cancelCaptionButton.closest("[data-caption-form]");
    const caption = form?.closest("[data-daily-photo]")?.querySelector("[data-photo-caption]");
    const textarea = form?.querySelector("textarea");
    if (textarea) textarea.value = caption?.textContent || "";
    if (form) form.hidden = true;
    return;
  }
  const current = event.target.closest("[data-delete-photo]");
  if (!current) return;
  if (!confirm(current.title)) return;
  const response = await fetch(`/api/photos/${current.dataset.photoId}`, { method: "DELETE" });
  if (!response.ok) alert(await response.text());
});
const openCaptionEditor = (photo) => {
  const form = photo?.querySelector("[data-caption-form]");
  if (!form) return;
  form.hidden = false;
  const textarea = form.querySelector("textarea");
  textarea?.focus();
  textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
};
document.querySelectorAll('[data-editable-caption="true"]').forEach((caption) => {
  caption.addEventListener("dblclick", () => openCaptionEditor(caption.closest("[data-daily-photo]")));
});
document.querySelectorAll("[data-caption-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const message = form.querySelector("[data-caption-message]");
    const submit = form.querySelector('button[type="submit"]');
    const caption = textarea?.value || "";
    if (submit) submit.disabled = true;
    if (message) message.hidden = true;
    try {
      const response = await fetch(`/api/photos/${form.dataset.photoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const captionElement = form.closest("[data-daily-photo]")?.querySelector("[data-photo-caption]");
      if (captionElement) {
        captionElement.textContent = String(data.caption || "");
        captionElement.hidden = !data.caption;
      }
      if (textarea) textarea.value = String(data.caption || "");
      form.hidden = true;
    } catch (error) {
      if (message) {
        message.textContent = error instanceof Error ? error.message : clientMessages.captionSaveError;
        message.hidden = false;
      }
    } finally {
      if (submit) submit.disabled = false;
    }
  });
});

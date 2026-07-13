import { readJsonConfig } from '../core/dom.js';

const clientMessages = readJsonConfig('profile-client-messages');

const formatCommentDate = (value) => new Intl.DateTimeFormat(document.documentElement.lang || "pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
const iconAttrs = `width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
const deleteButtonHtml = `<button class="comment-delete-trigger" type="button" data-comment-delete-trigger aria-label="${clientMessages.deleteMessage}" title="${clientMessages.deleteMessage}"><svg ${iconAttrs}><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg></button>`;
const cancelIcon = `<svg ${iconAttrs}><path d="m7 7 10 10M17 7 7 17" /></svg>`;
const confirmIcon = `<svg ${iconAttrs}><path d="m5 12 4 4L19 6" /></svg>`;
const undoIcon = `<svg ${iconAttrs}><path d="M9 7 4 12l5 5M5 12h8a6 6 0 1 1 0 12" /></svg>`;
const showCommentActionError = (item, message) => {
  const area = item.querySelector("[data-comment-delete-area]");
  if (!area) return;
  area.innerHTML = "";
  const error = document.createElement("span");
  error.className = "comment-delete-error";
  error.textContent = message;
  area.append(error);
  window.setTimeout(() => {
    area.innerHTML = deleteButtonHtml;
  }, 2500);
};
document.addEventListener("click", async (event) => {
  const target = event.target;
  const item = target.closest("[data-comment-item]");
  if (!item) return;
  const area = item.querySelector("[data-comment-delete-area]");
  const id = Number(item.dataset.commentId);
  if (!area || !id) return;
  if (target.closest("[data-comment-delete-trigger]")) {
    area.innerHTML = `
          <span class="comment-delete-confirm">${clientMessages.deleteQuestion}</span>
          <button class="comment-action-button is-confirm" type="button" data-comment-delete-confirm aria-label="${clientMessages.confirmDeletion}" title="${clientMessages.confirmDeletion}">${confirmIcon}</button>
          <button class="comment-action-button" type="button" data-comment-delete-cancel aria-label="${clientMessages.cancelDeletion}" title="${clientMessages.cancelDeletion}">${cancelIcon}</button>
        `;
    return;
  }
  if (target.closest("[data-comment-delete-cancel]")) {
    area.innerHTML = deleteButtonHtml;
    return;
  }
  if (target.closest("[data-comment-delete-confirm]")) {
    const response = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showCommentActionError(item, String(data.error || "N\xE3o foi poss\xEDvel excluir."));
      return;
    }
    item.classList.add("is-comment-deleted");
    area.innerHTML = `
          <span class="comment-deleted-label">${clientMessages.messageDeleted}</span>
          <button class="comment-undo-button" type="button" data-comment-undo>${undoIcon}<span>${clientMessages.undo}</span></button>
        `;
    const commentList = item.closest("[data-comment-list]");
    const commentPanel = item.closest("[data-comments-panel]");
    const removeTimer = window.setTimeout(() => {
      item.remove();
      if (commentList && !commentList.querySelector("[data-comment-item]")) {
        commentList.hidden = true;
        const empty = commentPanel?.querySelector("[data-comment-empty]");
        if (empty) empty.hidden = false;
      }
    }, 5e3);
    item.dataset.removeTimer = String(removeTimer);
    return;
  }
  if (target.closest("[data-comment-undo]")) {
    const timer = Number(item.dataset.removeTimer);
    if (timer) window.clearTimeout(timer);
    const response = await fetch(`/api/comments/${id}`, { method: "PATCH" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showCommentActionError(item, String(data.error || "N\xE3o foi poss\xEDvel desfazer."));
      return;
    }
    item.classList.remove("is-comment-deleted");
    delete item.dataset.removeTimer;
    area.innerHTML = deleteButtonHtml;
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-comment-form]");
  if (!form) return;
  event.preventDefault();
  const field = form.elements.namedItem("message");
  const button = form.querySelector('button[type="submit"]');
  const privateField = form.elements.namedItem("private");
  const panel = form.closest("[data-comments-panel]");
  const list = panel?.querySelector("[data-comment-list]");
  const empty = panel?.querySelector("[data-comment-empty]");
  const messageBox = panel?.querySelector("[data-comment-message]");
  const message = field.value.trim();
  const isPrivate = Boolean(privateField?.checked);
  if (!message || form.dataset.sending === "true") return;
  form.dataset.sending = "true";
  field.disabled = true;
  if (button) button.disabled = true;
  if (messageBox) messageBox.hidden = true;
  try {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: Number(form.dataset.postId), message, private: isPrivate })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(data.error || clientMessages.messageSendError));
    if (list && data.comment) {
      const article = document.createElement("article");
      const userLink = document.createElement("a");
      const strong = document.createElement("strong");
      const text = document.createElement("p");
      const time = document.createElement("time");
      const content = document.createElement("div");
      const deleteArea = document.createElement("div");
      const deleteButton = document.createElement("button");
      userLink.className = "received-message-user";
      userLink.href = `/perfil/${encodeURIComponent(String(data.comment.username))}`;
      strong.textContent = `@${data.comment.username}`;
      text.textContent = String(data.comment.message || message);
      time.textContent = formatCommentDate(String(data.comment.createdAt || (/* @__PURE__ */ new Date()).toISOString()));
      article.className = isPrivate ? "received-message-card is-inline is-private" : "received-message-card is-inline";
      article.dataset.commentItem = "";
      article.dataset.commentId = String(data.comment.id || "");
      content.className = "received-message-body";
      deleteArea.className = "received-message-actions";
      deleteArea.dataset.commentDeleteArea = "";
      deleteButton.className = "received-message-delete";
      deleteButton.type = "button";
      deleteButton.dataset.commentDeleteTrigger = "";
      deleteButton.setAttribute("aria-label", "Excluir mensagem");
      deleteButton.title = "Excluir mensagem";
      deleteButton.innerHTML = `<svg ${iconAttrs}><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg>`;
      const meta = document.createElement("div");
      meta.className = "received-message-meta";
      userLink.append(strong);
      deleteArea.append(deleteButton, time);
      meta.append(userLink, deleteArea);
      
      if (isPrivate) {
        const badge = document.createElement("div");
        badge.className = "private-comment-badge private-comment-badge-visible";
        badge.textContent = `\u{1F512} ${clientMessages.privateMessage}`;
        text.className = "private-comment-message";
        content.append(badge);
      }
      content.append(text, meta);
      article.append(content);
      list.append(article);
      list.hidden = false;
    }
    if (empty) empty.hidden = true;
    field.value = "";
    if (privateField) privateField.checked = false;
    field.focus();
  } catch (error) {
    if (messageBox) {
      messageBox.textContent = error instanceof Error ? error.message : clientMessages.messageSendError;
      messageBox.hidden = false;
    }
  } finally {
    delete form.dataset.sending;
    field.disabled = false;
    if (button) button.disabled = false;
  }
});

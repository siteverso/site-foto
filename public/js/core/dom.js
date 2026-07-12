export const query = (selector, root = document) => root?.querySelector(selector) ?? null;
export const queryAll = (selector, root = document) => [...(root?.querySelectorAll(selector) ?? [])];

export function readJsonConfig(id, fallback = {}) {
  const element = document.getElementById(id);
  if (!element) return fallback;
  try {
    return JSON.parse(element.textContent || '{}');
  } catch (error) {
    console.error(`[fotolife] Configuração JSON inválida: #${id}`, error);
    return fallback;
  }
}

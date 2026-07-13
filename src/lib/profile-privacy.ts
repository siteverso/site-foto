export type ProfileVisibility = 'public' | 'unlisted' | 'private' | 'deleted';
export type ProfileBlockLevel = 'all' | 'messages';

export function normalizeProfileVisibility(value: unknown): ProfileVisibility {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'unlisted' || normalized === 'private' || normalized === 'deleted' ? normalized : 'public';
}

export function normalizeProfileBlockLevel(value: unknown): ProfileBlockLevel {
  return String(value || '').trim().toLowerCase() === 'messages' ? 'messages' : 'all';
}

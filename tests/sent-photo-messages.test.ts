import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const repository = readFileSync('src/lib/server/repositories/sent-photo-messages.ts', 'utf8');
const page = readFileSync('src/pages/perfil/mensagens-enviadas.astro', 'utf8');
const sidebar = readFileSync('src/components/ProfileSidebar.astro', 'utf8');
const card = readFileSync('src/components/SentPhotoMessageCard.astro', 'utf8');

describe('sent post messages timeline', () => {
    it('filters exclusively by the authenticated sender and includes public and private messages', () => {
        expect(repository).toContain('WHERE c.user_id = :sender_user_id');
        expect(repository).toContain("IN ('public', 'private')");
        expect(repository).not.toContain("c.visibility_code = 'private'");
        expect(repository).toContain('ORDER BY c.created_at DESC, c.id DESC');
    });

    it('loads the timeline using the session user and no username route parameter', () => {
        expect(page).toContain('const user = await requireUser(Astro)');
        expect(page).toContain('getSentPhotoMessages(user.id)');
        expect(page).not.toContain('Astro.params');
    });

    it('shows the owner-only entry from the profile sidebar', () => {
        expect(sidebar).toContain('isOwner && !editableAvatar');
        expect(sidebar).toContain('href="/perfil/mensagens-enviadas"');
    });

    it('renders recipient, visibility, date, text and related photo context', () => {
        expect(card).toContain('item.recipient.username');
        expect(card).toContain('item.visibility');
        expect(card).toContain('formattedDate');
        expect(card).toContain('sent-photo-message-text');
        expect(card).toContain('/api/photos/${item.photoId}');
    });
});

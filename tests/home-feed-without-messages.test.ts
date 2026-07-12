import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const feedApi = readFileSync(new URL('../src/pages/api/feed/index.ts', import.meta.url), 'utf8');

describe('home photo cards', () => {
    it('shows only user, photo and description, without the messages area', () => {
        expect(home).toContain('photo-post-header');
        expect(home).toContain('photo-post-image');
        expect(home).toContain('photo-post-caption');
        expect(home).not.toContain('photo-comments');
        expect(home).not.toContain('data-comment-form');
        expect(home).not.toContain('data-comments-dialog');
        expect(home).not.toContain('Escreva uma mensagem');
    });

    it('does not load comments through the home feed API', () => {
        expect(feedApi).not.toContain('getComments');
        expect(feedApi).toContain('getFeedPhotos');
    });
});

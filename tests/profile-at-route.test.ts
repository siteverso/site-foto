import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const routeSource = readFileSync(resolve('src/pages/@[username].astro'), 'utf8');

describe('short profile route /@username', () => {
    it('redirects to the canonical profile page without duplicating profile logic', () => {
        expect(routeSource).toContain("Astro.params.username");
        expect(routeSource).toContain("/perfil/${encodeURIComponent(username)}");
        expect(routeSource).toContain('Astro.redirect');
    });
});

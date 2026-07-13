import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/lib/server/repositories/profile-privacy.ts', 'utf8');

describe('profile block access direction', () => {
  it('hides the profile only when the profile owner blocked the viewer', () => {
    const canAccessProfile = source.slice(
      source.indexOf('export async function canAccessProfile'),
      source.indexOf('export async function canExchangeMessages'),
    );

    expect(canAccessProfile).toContain('b.blocker_user_id = u.id');
    expect(canAccessProfile).toContain('b.blocked_user_id = :viewer');
    expect(canAccessProfile).not.toContain('b.blocker_user_id = :viewer');
  });
});

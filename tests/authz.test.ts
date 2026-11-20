import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ token: undefined as string | undefined, reservation: null as unknown, floorPlan: null as unknown }));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'session' && state.token ? { value: state.token } : undefined) }),
}));
vi.mock('@/lib/prisma', () => ({
  default: {
    reservation: { findUnique: async () => state.reservation },
    floorPlan: { findUnique: async () => state.floorPlan },
  },
}));

import {
  requireAdmin,
  requireFloorPlanAccess,
  requireReservationAccess,
  requireSession,
  requireTenantAccess,
} from '../lib/authz';
import { signSession } from '../lib/session';

beforeEach(async () => {
  vi.stubEnv('SESSION_SECRET', 'test-secret');
  state.token = undefined;
  state.reservation = null;
  state.floorPlan = null;
});

describe('authorization guards', () => {
  it('rejects anonymous callers', async () => {
    await expect(requireSession()).rejects.toThrow('Not authenticated');
    await expect(requireAdmin()).rejects.toThrow('Not authenticated');
    await expect(requireTenantAccess('t1')).rejects.toThrow('Not authenticated');
  });

  it('lets an admin act on any tenant but owners only on their own', async () => {
    state.token = await signSession({ role: 'admin' });
    await expect(requireAdmin()).resolves.toMatchObject({ role: 'admin' });
    await expect(requireTenantAccess('any-tenant')).resolves.toBeTruthy();

    state.token = await signSession({ role: 'owner', tenantId: 't1' });
    await expect(requireTenantAccess('t1')).resolves.toBeTruthy();
    await expect(requireTenantAccess('t2')).rejects.toThrow('Forbidden');
  });

  it('keeps owners out of admin-only actions', async () => {
    state.token = await signSession({ role: 'owner', tenantId: 't1' });
    await expect(requireAdmin()).rejects.toThrow('Forbidden');
  });

  it('resolves reservation and floor-plan access through the owning tenant', async () => {
    state.token = await signSession({ role: 'owner', tenantId: 't1' });

    state.reservation = { tenantId: 't1' };
    await expect(requireReservationAccess('r1')).resolves.toBeTruthy();
    state.reservation = { tenantId: 'someone-else' };
    await expect(requireReservationAccess('r1')).rejects.toThrow('Forbidden');
    state.reservation = null;
    await expect(requireReservationAccess('missing')).rejects.toThrow('Reservation not found');

    state.floorPlan = { tenantId: 'someone-else' };
    await expect(requireFloorPlanAccess('f1')).rejects.toThrow('Forbidden');
    state.floorPlan = { tenantId: 't1' };
    await expect(requireFloorPlanAccess('f1')).resolves.toBeTruthy();
  });

  it('ignores a tampered session cookie', async () => {
    const token = await signSession({ role: 'admin' });
    state.token = token.slice(0, -2) + 'xx';
    await expect(requireAdmin()).rejects.toThrow('Not authenticated');
  });
});

import { describe, expect, it } from 'vitest';
import { bookingSchema } from '../lib/validations/booking';

const valid = {
  customerName: 'Ada Lovelace',
  phoneNumber: '5551234567',
  email: 'ada@example.com',
  date: '2026-12-01',
  time: '19:30',
  guestCount: 4,
  tableIds: ['t1', 't2'],
  tenantId: 'tenant-1',
};

describe('bookingSchema', () => {
  it('accepts a complete booking and keeps endTime optional', () => {
    expect(bookingSchema.safeParse(valid).success).toBe(true);
    expect(bookingSchema.safeParse({ ...valid, endTime: '2026-12-01T21:30:00Z' }).success).toBe(true);
  });

  it.each([
    ['name too short', { customerName: 'A' }, 'Name is required'],
    ['phone too short', { phoneNumber: '12345' }, 'Valid phone number is required'],
    ['invalid email', { email: 'not-an-email' }, 'Invalid email address'],
  ])('rejects %s', (_label, patch, message) => {
    const result = bookingSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((i) => i.message)).toContain(message);
  });

  it('requires at least one table and at least one guest', () => {
    expect(bookingSchema.safeParse({ ...valid, tableIds: [] }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, guestCount: 0 }).success).toBe(false);
  });

  it('rejects missing tenant and non-numeric guest counts', () => {
    const { tenantId: _omit, ...withoutTenant } = valid;
    expect(bookingSchema.safeParse(withoutTenant).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, guestCount: '4' }).success).toBe(false);
  });
});

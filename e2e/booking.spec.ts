import { expect, test } from '@playwright/test';

// Seeded by prisma/seed.ts: tenant "demo" with tables T1-T6, B1, B2.
const OWNER = { username: 'demo', password: process.env.SEED_DEMO_PASSWORD ?? 'demo1234' };

// Two days ahead, so the seed's "now + N minutes" reservations never overlap the requested slot.
function inTwoDays(): string {
  const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function signIn(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/');
  await page.getByPlaceholder('owner or admin').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test('live ops is protected and rejects a wrong password', async ({ page }) => {
  await page.goto('/liveops');
  await expect(page).toHaveURL(/\/$/);

  await signIn(page, OWNER.username, 'wrong-password');
  await expect(page.getByText('Invalid username or password')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test('a guest booking request reaches the owner pending queue', async ({ page }) => {
  const guest = `E2E Guest ${Date.now()}`;

  // Guest side: public booking page, no session.
  await page.goto('/booking/demo');
  await page.locator('input[type="date"]').fill(inTwoDays());
  await page.locator('input[type="time"]').fill('19:00');
  await page.locator('input[type="number"]').fill('2');
  await page.getByRole('button', { name: 'Check Availability' }).click();
  await expect(page.getByText('Select your Table')).toBeVisible();

  // Any table that is still free (earlier runs may have booked some); unavailable ones say so in their label.
  await page.getByRole('button', { name: /^Table \w+, seats \d+$/ }).first().click();
  await expect(page.getByText('Complete Booking')).toBeVisible();
  await page.getByPlaceholder('John Doe').fill(guest);
  await page.getByPlaceholder('+90 555 123 4567').fill('5550001122');
  await page.getByPlaceholder('john@example.com').fill('e2e@example.com');
  await page.locator('form button[type="submit"]').last().click();
  await expect(page.getByText('Request Sent!')).toBeVisible();

  // Owner side: the signed session cookie unlocks live ops and the request is queued.
  await signIn(page, OWNER.username, OWNER.password);
  await expect(page).toHaveURL(/\/liveops$/);
  await expect(page.getByText(guest)).toBeVisible();
});

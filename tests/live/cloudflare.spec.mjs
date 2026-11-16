import { test, expect } from '@playwright/test';

test('live site loads Ore & Order and shows v1.1', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response, 'Cloudflare should respond').not.toBeNull();
  expect(response.status(), 'Cloudflare HTTP status').toBeLessThan(400);
  await expect(page.locator('header.topbar .brand')).toContainText('ORE & ORDER');
  await expect(page.locator('header.topbar .brand')).toContainText('v1.1');
  await expect(page.locator('header.topbar .wallet')).toBeVisible();
});

test('factory and staff navigation work on live site', async ({ page }) => {
  await page.goto('/');
  const menu = page.getByRole('navigation', { name: 'Main menu' });
  await expect(menu.getByRole('button', { name: /factory/i })).toBeVisible();
  await menu.getByRole('button', { name: /staff/i }).click();
  await expect(menu.getByRole('button', { name: /staff/i })).toHaveClass(/active/);
  await menu.getByRole('button', { name: /factory/i }).click();
  await expect(menu.getByRole('button', { name: /factory/i })).toHaveClass(/active/);
});

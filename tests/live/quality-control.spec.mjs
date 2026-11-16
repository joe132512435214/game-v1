import { test, expect } from '@playwright/test';

const SAVE_KEY = 'ironworks-tycoon-save-v2';

test('quality control requires a mine on a fresh save', async ({ page }) => {
  await page.goto('/');
  const menu = page.getByRole('navigation', { name: 'Main menu' });
  await menu.getByRole('button', { name: /Quality & Themes/i }).click();
  await expect(page.getByRole('button', { name: 'BUILD YOUR FIRST MINE' })).toBeDisabled();
});

test('quality control completes a perfect shift and awards two style tokens', async ({ page }) => {
  // Isolated browser context: test save never touches a player's actual save.
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify({ miner: 1, cash: 10000, qcReadyAt: 0, styleTokens: 0 }));
  }, { key: SAVE_KEY });
  await page.goto('/');
  const menu = page.getByRole('navigation', { name: 'Main menu' });
  await menu.getByRole('button', { name: /Quality & Themes/i }).click();
  await page.getByRole('button', { name: 'START QUALITY CHECK' }).click();
  const game = page.getByRole('region', { name: 'Quality Control mini-game' });
  await expect(game).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await expect(game.getByText(`PLATE ${i + 1}/10`)).toBeVisible();
    const defect = await game.locator('.qc-accessible-defect').innerText();
    const reject = !defect.includes('All bolts present');
    await game.getByRole('button', { name: reject ? /REJECT/ : /KEEP/ }).click();
  }
  await expect(game.getByText('10/10 correct')).toBeVisible();
  await expect(game.getByText(/\+2 Style Tokens/)).toBeVisible();
  await game.getByRole('button', { name: 'BACK TO THEMES' }).click();
  await expect(menu.getByRole('button', { name: /Quality & Themes/i })).toContainText('2');
});

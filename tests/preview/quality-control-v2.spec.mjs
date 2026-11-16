import { test, expect } from '@playwright/test';

const SAVE_KEY = 'ironworks-tycoon-save-v2';

async function openGame(page) {
  await page.addInitScript((key) => {
    // Test-browser storage only; real players' saves are never touched.
    localStorage.setItem(key, JSON.stringify({ miner: 1, cash: 10000, styleTokens: 0, qcReadyAt: 0 }));
  }, SAVE_KEY);
  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Main menu' });
  await navigation.getByRole('button', { name: /Quality & Themes/i }).click();
  await page.getByRole('button', { name: 'START QUALITY CHECK' }).click();
  return page.getByRole('region', { name: 'Quality Control mini-game' });
}

test('mini-game plays a full perfect shift and awards 2 style tokens', async ({ page }) => {
  const game = await openGame(page);
  await expect(game.locator('.qc-conveyor')).toBeVisible();
  await expect(game.locator('.qc-actions button')).toHaveCount(2);

  for (let i = 1; i <= 10; i++) {
    await expect(game.locator('.qc-score')).toContainText(`PLATE ${i}/10`);
    const description = await game.locator('.qc-accessible-defect').innerText();
    const reject = !description.startsWith('All bolts present');
    await game.locator(reject ? '.qc-reject' : '.qc-keep').click();
    await expect(game.locator('.qc-feedback')).toBeVisible();
    await expect(game.locator('.qc-feedback')).toContainText(/GOOD PART|DEFECT CAUGHT/);
  }

  await expect(game.locator('.qc-result')).toContainText('10/10 correct');
  await expect(game.locator('.qc-token-result')).toContainText('+2 STYLE TOKENS');
  await expect(game.locator('.qc-results-grid')).toContainText('BEST STREAK');
  await game.getByRole('button', { name: 'BACK TO THEMES' }).click();
  await expect(page.locator('.welcome-row .staff-summary')).toContainText('2');
});

test('three wrong decisions end a shift without awarding tokens', async ({ page }) => {
  const game = await openGame(page);
  for (let i = 1; i <= 3; i++) {
    await expect(game.locator('.qc-score')).toContainText(`PLATE ${i}/10`);
    const description = await game.locator('.qc-accessible-defect').innerText();
    const wrongChoice = description.startsWith('All bolts present') ? '.qc-reject' : '.qc-keep';
    await game.locator(wrongChoice).click();
    await expect(game.locator('.qc-feedback')).toContainText('WRONG CALL');
  }
  await expect(game.locator('.qc-result')).toContainText('0/10 correct');
  await expect(game.locator('.qc-token-result')).toContainText('+0 STYLE TOKENS');
});

test('pausing production freezes the inspection and disables controls', async ({ page }) => {
  const game = await openGame(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(game.locator('.qc-reject')).toBeDisabled();
  await expect(game.locator('.qc-keep')).toBeDisabled();
  await page.waitForTimeout(4300);
  await expect(game.locator('.qc-score')).toContainText('PLATE 1/10');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(game.locator('.qc-reject')).toBeEnabled();
});

test('mobile inspection buttons remain large and usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const game = await openGame(page);
  for (const selector of ['.qc-reject', '.qc-keep']) {
    const bounds = await game.locator(selector).boundingBox();
    expect(bounds?.width).toBeGreaterThan(110);
    expect(bounds?.height).toBeGreaterThanOrEqual(80);
  }
});

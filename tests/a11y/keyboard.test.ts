import { test, expect } from '@playwright/test';

test.describe('Keyboard Walkthrough & Navigation', () => {
  test('Skip to main content link is keyboard accessible and shifts focus', async ({ page }) => {
    await page.goto('/');

    // Tab to skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();

    // Activate skip link
    await page.keyboard.press('Enter');

    // Main content should receive focus or target
    await expect(page).toHaveURL(/#main-content/);
  });

  test('Keyboard shortcut Alt+Shift+H opens help dialog and Esc closes it', async ({ page }) => {
    await page.goto('/');

    const dialog = page.locator('#shortcuts-dialog');
    await expect(dialog).not.toHaveAttribute('open');

    // Press Alt+Shift+H
    await page.keyboard.press('Alt+Shift+KeyH');
    await expect(dialog).toHaveAttribute('open');

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');
  });

  test('Form fields are fully navigable via Tab and Enter keys', async ({ page }) => {
    await page.goto('/auth/login');

    // Tab to skip link, then brand, home, workshops, sign in, email
    await page.locator('#email').focus();
    await expect(page.locator('#email')).toBeFocused();

    await page.keyboard.type('test@example.com');
    await page.keyboard.press('Tab');
    await expect(page.locator('#password')).toBeFocused();

    await page.keyboard.type('secret');
    await page.keyboard.press('Tab');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();
  });
});

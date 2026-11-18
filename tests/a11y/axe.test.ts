import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 AA Accessibility Audits (axe-core)', () => {
  test('Home page should have zero axe-core violations', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Sign In page should have zero axe-core violations', async ({ page }) => {
    await page.goto('/auth/login');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Sign In page with errors should have zero axe-core violations', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button[type="submit"]'); // Trigger client / server validation
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Public Sessions list should have zero axe-core violations', async ({ page }) => {
    await page.goto('/sessions');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Learner My Sessions page should have zero axe-core violations', async ({ page }) => {
    // Sign in as learner
    await page.goto('/auth/login');
    await page.fill('#email', 'charlie.learner@workshophouse.test');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/my-sessions');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Preferences page should have zero axe-core violations', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'charlie.learner@workshophouse.test');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/preferences');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Coordinator Sessions management should have zero axe-core violations', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'coordinator@workshophouse.test');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/coordinator/sessions');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard should have zero axe-core violations', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#email', 'coordinator@workshophouse.test');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

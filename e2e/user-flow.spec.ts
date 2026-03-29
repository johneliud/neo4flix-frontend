import { test, expect } from '@playwright/test';

const TIMESTAMP = Date.now();
const TEST_USER = {
  username: `testuser${TIMESTAMP}`,
  email: `test${TIMESTAMP}@example.com`,
  password: 'TestPassword1!',
};

test.describe('User Flow: Register → Login → Browse → Rate → Recommendations', () => {
  test('complete user journey', async ({ page }) => {
    await page.goto('/register');

    await expect(page).toHaveURL(/register/);

    await page.fill('input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[formControlName="email"]', TEST_USER.email);
    await page.fill('input[formControlName="password"]', TEST_USER.password);
    await page.fill('input[formControlName="confirmPassword"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/login', { timeout: 10000 });

    await page.fill('input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[formControlName="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/', { timeout: 10000 });

    await expect(page.locator('app-movie-card').first()).toBeVisible({ timeout: 10000 });

    const movieCards = page.locator('app-movie-card');
    const count = await movieCards.count();
    expect(count).toBeGreaterThan(0);

    await movieCards.first().click();

    await expect(page).toHaveURL(/\/movies\/.+/, { timeout: 10000 });

    await expect(page.locator('h1, h2').first()).toBeVisible();

    const ratingStars = page.locator('app-rating button');
    const ratingCount = await ratingStars.count();
    if (ratingCount > 0) {
      await ratingStars.nth(4).click();
    }

    await page.click('text=Recommendations');

    await expect(page).toHaveURL('/recommendations', { timeout: 10000 });

    await expect(page.locator('app-movie-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated user is redirected to login for protected routes', async ({ page }) => {
    await page.goto('/recommendations');
    await expect(page).toHaveURL('/login');
  });

  test('login page redirects authenticated users away from login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    await page.fill('input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[formControlName="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});

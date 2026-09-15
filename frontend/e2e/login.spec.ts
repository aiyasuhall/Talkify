import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5001/api';

test.describe('Login flow', () => {
  test('TC-1 — successful login redirects to dashboard', async ({ page }) => {
    await page.route(`${API_BASE}/auth/signin`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'test-access-token' }),
      });
    });

    await page.route(`${API_BASE}/users/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        }),
      });
    });

    await page.route(`${API_BASE}/conversations`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ conversations: [] }),
      });
    });

    await page.route('**/socket.io/**', (route) => route.abort());

    await page.goto('/');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('validpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/app');
    await expect(page.getByText('testuser')).toBeVisible();
  });

  test('TC-2 — invalid credentials shows error and stays on login page', async ({ page }) => {
    await page.route(`${API_BASE}/auth/signin`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    });

    await page.goto('/');
    await page.getByLabel('Username').fill('wronguser');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Login failed!')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('TC-3 — empty fields block submission and show validation errors', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Username must have at least 3 characters.')).toBeVisible();
    await expect(page.getByText('Password must have at least 6 characters.')).toBeVisible();
    await expect(page).toHaveURL('/');
  });
});

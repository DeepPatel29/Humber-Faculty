import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test.describe('Route Protection', () => {
    test('unauthenticated user is redirected to login', async ({ page }) => {
      await page.goto('/faculty/dashboard');
      await page.waitForURL('**/login**');
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('unauthenticated user cannot access admin routes', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForURL('**/login**');
    });

    test('unauthenticated user cannot access scheduler routes', async ({ page }) => {
      await page.goto('/scheduler/dashboard');
      await page.waitForURL('**/login**');
    });
  });

  test.describe('Signup and Role Test', () => {
    test('can signup as a new user', async ({ page }) => {
      const uniqueEmail = `test${Date.now()}@university.edu`;
      
      await page.goto('/signup');
      await page.fill('input[placeholder="Dr. John Smith"]', 'Test User');
      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[placeholder="Min. 8 characters"]', 'password123');
      await page.click('button:has-text("Create Account")');
      
      await page.waitForURL('**/faculty/dashboard', { timeout: 15000 });
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('login page is accessible', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    });

    test('signup link works', async ({ page }) => {
      await page.goto('/login');
      await page.click('text=Sign up');
      await page.waitForURL('**/signup');
      await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
    });
  });

  test.describe('Unauthorized Page', () => {
    test('unauthorized page is accessible', async ({ page }) => {
      await page.goto('/unauthorized');
      await expect(page.locator('text=Access Denied')).toBeVisible();
      await expect(page.locator('text=Go to Faculty Dashboard')).toBeVisible();
    });
  });

  test.describe('Static Pages', () => {
    test('home page loads', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/(login|faculty\/dashboard)?$/);
    });
  });
});

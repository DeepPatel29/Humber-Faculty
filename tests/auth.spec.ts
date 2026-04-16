import { test, expect, TEST_USERS, loginAs, logout } from "./fixtures/auth";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test.describe("Login Page", () => {
    test("login page is accessible", async ({ page }) => {
      await page.goto("/login");

      await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    });

    test("login page has signup link", async ({ page }) => {
      await page.goto("/login");

      await expect(page.locator("text=Sign up")).toBeVisible();
      await page.click("text=Sign up");
      await page.waitForURL("**/signup");
      await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
    });

    test("shows error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.fill('input[type="email"]', "invalid@test.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button:has-text("Sign In")');

      await expect(
        page.locator("text=/invalid|incorrect|failed/i"),
      ).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Mock Login", () => {
    test("can login as faculty", async ({ page }) => {
      await loginAs(page, "faculty");
      await page.goto("/faculty/dashboard");

      await expect(page).toHaveURL(/\/faculty\/dashboard/);
      await expect(page.locator("text=Dashboard")).toBeVisible({
        timeout: 10000,
      });
    });

    test("can login as admin", async ({ page }) => {
      await loginAs(page, "admin");
      await page.goto("/admin/dashboard");

      await expect(page).toHaveURL(/\/admin\/dashboard/);
      await expect(page.locator("text=Dashboard")).toBeVisible({
        timeout: 10000,
      });
    });

    test("can login as scheduler", async ({ page }) => {
      await loginAs(page, "scheduler");
      await page.goto("/scheduler/dashboard");

      await expect(page).toHaveURL(/\/scheduler\/dashboard/);
      await expect(page.locator("text=Dashboard")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Session Management", () => {
    test("session persists across page reloads", async ({ page }) => {
      await loginAs(page, "faculty");
      await page.goto("/faculty/dashboard");

      await expect(page.locator("text=Dashboard")).toBeVisible({
        timeout: 10000,
      });

      await page.reload();

      await expect(page).toHaveURL(/\/faculty\/dashboard/);
      await expect(page.locator("text=Dashboard")).toBeVisible({
        timeout: 10000,
      });
    });

    test("logout clears session", async ({ page }) => {
      await loginAs(page, "faculty");
      await page.goto("/faculty/dashboard");

      await expect(page.locator("text=Dashboard")).toBeVisible({
        timeout: 10000,
      });

      await logout(page);
      await page.goto("/faculty/dashboard");

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Role-Based Redirects", () => {
    test("faculty is redirected to /faculty/dashboard", async ({ page }) => {
      await loginAs(page, "faculty");
      await page.goto("/");

      await expect(page).toHaveURL(/\/faculty\/dashboard/, { timeout: 10000 });
    });

    test("admin is redirected to /admin/dashboard", async ({ page }) => {
      await loginAs(page, "admin");
      await page.goto("/");

      await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
    });

    test("scheduler is redirected to /scheduler/dashboard", async ({
      page,
    }) => {
      await loginAs(page, "scheduler");
      await page.goto("/");

      await expect(page).toHaveURL(/\/scheduler\/dashboard/, {
        timeout: 10000,
      });
    });
  });

  test.describe("Route Protection", () => {
    test("unauthenticated user cannot access faculty routes", async ({
      page,
    }) => {
      await page.goto("/faculty/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });

    test("unauthenticated user cannot access admin routes", async ({
      page,
    }) => {
      await page.goto("/admin/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });

    test("unauthenticated user cannot access scheduler routes", async ({
      page,
    }) => {
      await page.goto("/scheduler/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Signup Page", () => {
    test("signup page is accessible", async ({ page }) => {
      await page.goto("/signup");

      await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
      await expect(
        page.locator('input[placeholder="Dr. John Smith"]'),
      ).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(
        page.locator('input[placeholder="Min. 8 characters"]'),
      ).toBeVisible();
      await expect(
        page.locator('button:has-text("Create Account")'),
      ).toBeVisible();
    });

    test("can signup as a new user", async ({ page }) => {
      const uniqueEmail = `test${Date.now()}@university.edu`;

      await page.goto("/signup");
      await page.fill('input[placeholder="Dr. John Smith"]', "Test User");
      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[placeholder="Min. 8 characters"]', "password123");
      await page.click('button:has-text("Create Account")');

      await expect(page).toHaveURL(/\/faculty\/dashboard/, { timeout: 15000 });
      await expect(page.locator("text=Dashboard")).toBeVisible();
    });

    test("signup page has login link", async ({ page }) => {
      await page.goto("/signup");

      await expect(page.locator("text=Sign in")).toBeVisible();
      await page.click("text=Sign in");
      await page.waitForURL("**/login");
      await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();
    });
  });
});

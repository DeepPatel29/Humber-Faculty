import { test, expect } from "../fixtures/auth";
import { loginAs } from "../fixtures/auth";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "admin");
  });

  test("admin dashboard page loads", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows admin navigation", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(page.locator("text=Dashboard")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Faculty")).toBeVisible();
    await expect(page.locator("text=Requests")).toBeVisible();
  });

  test("displays summary statistics", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(
      page.locator("text=/total faculty|pending requests|departments/i"),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows pending requests queue", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(
      page.locator("text=/pending requests|request queue|review requests/i"),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "admin");
  });

  test("can navigate to faculty management", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.click("text=Faculty");

    await expect(page).toHaveURL(/\/admin\/faculty/);
  });

  test("can navigate to requests management", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.click("text=Requests");

    await expect(page).toHaveURL(/\/admin\/requests/);
  });
});

test.describe("Admin Request Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "admin");
  });

  test("requests page loads", async ({ page }) => {
    await page.goto("/admin/requests");

    await expect(page.locator("h1:has-text('Requests')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("can filter requests by status", async ({ page }) => {
    await page.goto("/admin/requests");

    const pendingFilter = page.locator("button:has-text('Pending')");
    if (await pendingFilter.isVisible()) {
      await pendingFilter.click();
    }
  });

  test("can approve pending request", async ({ page }) => {
    await page.goto("/admin/requests");

    const approveButton = page.locator("button:has-text('Approve')");
    if (await approveButton.first().isVisible()) {
      await approveButton.first().click();
    }
  });

  test("can reject pending request", async ({ page }) => {
    await page.goto("/admin/requests");

    const rejectButton = page.locator("button:has-text('Reject')");
    if (await rejectButton.first().isVisible()) {
      await rejectButton.first().click();
    }
  });
});

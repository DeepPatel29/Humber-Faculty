import { test, expect } from "../fixtures/auth";
import { loginAs } from "../fixtures/auth";

test.describe("Faculty Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("dashboard page loads", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows user greeting", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=Welcome back")).toBeVisible({
      timeout: 10000,
    });
  });

  test("displays summary cards", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=Classes This Week")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Total Students")).toBeVisible();
    await expect(page.locator("text=Pending Requests")).toBeVisible();
    await expect(page.locator("text=Office Hours")).toBeVisible();
  });

  test("shows today's schedule section", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=Today's Schedule")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows upcoming classes section", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=Upcoming Classes")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows recent notifications section", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=Recent Notifications")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows quick overview section", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=Quick Overview")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Department")).toBeVisible();
    await expect(page.locator("text=Designation")).toBeVisible();
    await expect(page.locator("text=Email")).toBeVisible();
  });

  test("navigates to timetable from dashboard", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await page.click("text=View All");
    await page.waitForURL("**/faculty/timetable");

    await expect(page).toHaveURL(/\/faculty\/timetable/);
  });

  test("displays empty state when no classes", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=No classes today")).toBeVisible({
      timeout: 10000,
    });
  });

  test("has navigation sidebar", async ({ page }) => {
    await page.goto("/faculty/dashboard");

    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Timetable")).toBeVisible();
    await expect(page.locator("text=Requests")).toBeVisible();
    await expect(page.locator("text=Profile")).toBeVisible();
    await expect(page.locator("text=Availability")).toBeVisible();
    await expect(page.locator("text=Notifications")).toBeVisible();
  });
});

test.describe("Faculty Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("can navigate to timetable", async ({ page }) => {
    await page.goto("/faculty/dashboard");
    await page.click("text=Timetable");

    await expect(page).toHaveURL(/\/faculty\/timetable/);
  });

  test("can navigate to requests", async ({ page }) => {
    await page.goto("/faculty/dashboard");
    await page.click("text=Requests");

    await expect(page).toHaveURL(/\/faculty\/requests/);
  });

  test("can navigate to profile", async ({ page }) => {
    await page.goto("/faculty/dashboard");
    await page.click("text=Profile");

    await expect(page).toHaveURL(/\/faculty\/profile/);
  });

  test("can navigate to availability", async ({ page }) => {
    await page.goto("/faculty/dashboard");
    await page.click("text=Availability");

    await expect(page).toHaveURL(/\/faculty\/availability/);
  });

  test("can navigate to notifications", async ({ page }) => {
    await page.goto("/faculty/dashboard");
    await page.click("text=Notifications");

    await expect(page).toHaveURL(/\/faculty\/notifications/);
  });
});

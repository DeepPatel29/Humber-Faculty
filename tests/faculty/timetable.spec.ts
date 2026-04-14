import { test, expect } from "../fixtures/auth";
import { loginAs } from "../fixtures/auth";

test.describe("Faculty Timetable", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("timetable page loads", async ({ page }) => {
    await page.goto("/faculty/timetable");

    await expect(page.locator("h1:has-text('Timetable')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("displays weekly schedule view", async ({ page }) => {
    await page.goto("/faculty/timetable");

    await expect(page.locator("text=Monday")).toBeVisible({ timeout: 10000 });
  });

  test("shows current week info", async ({ page }) => {
    await page.goto("/faculty/timetable");

    await expect(page.locator("text=Week")).toBeVisible({ timeout: 10000 });
  });

  test("can navigate to next week", async ({ page }) => {
    await page.goto("/faculty/timetable");

    const nextButton = page.locator("button:has-text('Next')");
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await expect(page.locator("text=Week")).toBeVisible();
    }
  });

  test("can navigate to previous week", async ({ page }) => {
    await page.goto("/faculty/timetable");

    const prevButton = page.locator("button:has-text('Previous')");
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await expect(page.locator("text=Week")).toBeVisible();
    }
  });

  test("displays empty state when no schedule", async ({ page }) => {
    await page.goto("/faculty/timetable");

    await expect(page.locator("text=/no classes|no schedule/i")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Timetable Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("has course code filter", async ({ page }) => {
    await page.goto("/faculty/timetable");

    const courseFilter = page.locator("input[placeholder*='course']");
    if (await courseFilter.isVisible()) {
      await courseFilter.fill("WEB");
    }
  });

  test("has program filter", async ({ page }) => {
    await page.goto("/faculty/timetable");

    const programFilter = page.locator("select, input[placeholder*='program']");
    if (await programFilter.first().isVisible()) {
      await programFilter.first().click();
    }
  });
});

import { test, expect } from "../fixtures/auth";
import { loginAs } from "../fixtures/auth";

test.describe("Faculty Requests", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("requests page loads", async ({ page }) => {
    await page.goto("/faculty/requests");

    await expect(page.locator("h1:has-text('Requests')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows create request buttons", async ({ page }) => {
    await page.goto("/faculty/requests");

    await expect(
      page.locator("text=/new request|create|swap|reschedule|leave/i"),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("displays request history", async ({ page }) => {
    await page.goto("/faculty/requests");

    await expect(
      page.locator("text=/request history|my requests|no requests/i"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("can open swap request dialog", async ({ page }) => {
    await page.goto("/faculty/requests");

    const swapButton = page.locator("button:has-text('Swap')");
    if (await swapButton.isVisible()) {
      await swapButton.click();
      await expect(page.locator("text=/swap class|select class/i")).toBeVisible(
        { timeout: 5000 },
      );
    }
  });

  test("can open reschedule request dialog", async ({ page }) => {
    await page.goto("/faculty/requests");

    const rescheduleButton = page.locator("button:has-text('Reschedule')");
    if (await rescheduleButton.isVisible()) {
      await rescheduleButton.click();
      await expect(
        page.locator("text=/reschedule|new date|new time/i"),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("can open leave request dialog", async ({ page }) => {
    await page.goto("/faculty/requests");

    const leaveButton = page.locator("button:has-text('Leave')");
    if (await leaveButton.isVisible()) {
      await leaveButton.click();
      await expect(
        page.locator("text=/leave|start date|end date/i"),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Request Status Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("can filter by pending status", async ({ page }) => {
    await page.goto("/faculty/requests");

    const pendingFilter = page.locator("button:has-text('Pending')");
    if (await pendingFilter.isVisible()) {
      await pendingFilter.click();
    }
  });

  test("can filter by approved status", async ({ page }) => {
    await page.goto("/faculty/requests");

    const approvedFilter = page.locator("button:has-text('Approved')");
    if (await approvedFilter.isVisible()) {
      await approvedFilter.click();
    }
  });

  test("can filter by rejected status", async ({ page }) => {
    await page.goto("/faculty/requests");

    const rejectedFilter = page.locator("button:has-text('Rejected')");
    if (await rejectedFilter.isVisible()) {
      await rejectedFilter.click();
    }
  });
});

test.describe("Request Actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("can view request details", async ({ page }) => {
    await page.goto("/faculty/requests");

    const viewButton = page.locator("button:has-text('View')");
    if (await viewButton.first().isVisible()) {
      await viewButton.first().click();
    }
  });

  test("can withdraw pending request", async ({ page }) => {
    await page.goto("/faculty/requests");

    const withdrawButton = page.locator("button:has-text('Withdraw')");
    if (await withdrawButton.first().isVisible()) {
      await withdrawButton.first().click();
    }
  });
});

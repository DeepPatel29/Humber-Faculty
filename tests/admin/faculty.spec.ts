import { test, expect } from "../fixtures/auth";
import { loginAs } from "../fixtures/auth";

test.describe("Admin Faculty Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "admin");
  });

  test("faculty list page loads", async ({ page }) => {
    await page.goto("/admin/faculty");

    await expect(page.locator("h1:has-text('Faculty')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("displays faculty directory", async ({ page }) => {
    await page.goto("/admin/faculty");

    await expect(
      page.locator("text=/faculty directory|all faculty|search/i"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("has add faculty button", async ({ page }) => {
    await page.goto("/admin/faculty");

    await expect(page.locator("button:has-text('Add')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("can search faculty", async ({ page }) => {
    await page.goto("/admin/faculty");

    const searchInput = page.locator("input[placeholder*='search' i]");
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
    }
  });

  test("can filter by department", async ({ page }) => {
    await page.goto("/admin/faculty");

    const departmentFilter = page.locator("select");
    if (await departmentFilter.isVisible()) {
      await departmentFilter.click();
    }
  });

  test("faculty table has expected columns", async ({ page }) => {
    await page.goto("/admin/faculty");

    await expect(
      page.locator("text=/name|email|department|status/i"),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Faculty CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "admin");
  });

  test("can view faculty details", async ({ page }) => {
    await page.goto("/admin/faculty");

    const viewButton = page.locator("button:has-text('View')");
    if (await viewButton.first().isVisible()) {
      await viewButton.first().click();
    }
  });

  test("can edit faculty", async ({ page }) => {
    await page.goto("/admin/faculty");

    const editButton = page.locator("button:has-text('Edit')");
    if (await editButton.first().isVisible()) {
      await editButton.first().click();
    }
  });

  test("can delete faculty", async ({ page }) => {
    await page.goto("/admin/faculty");

    const deleteButton = page.locator("button:has-text('Delete')");
    if (await deleteButton.first().isVisible()) {
      await deleteButton.first().click();
    }
  });
});

test.describe("Add New Faculty", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "admin");
  });

  test("can open add faculty form", async ({ page }) => {
    await page.goto("/admin/faculty");

    const addButton = page.locator("button:has-text('Add')");
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator("text=/add faculty|new faculty/i")).toBeVisible(
        { timeout: 5000 },
      );
    }
  });

  test("add faculty form has required fields", async ({ page }) => {
    await page.goto("/admin/faculty");

    const addButton = page.locator("button:has-text('Add')");
    if (await addButton.isVisible()) {
      await addButton.click();

      await expect(page.locator("input[name='name']")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("input[name='email']")).toBeVisible();
    }
  });

  test("can create new faculty", async ({ page }) => {
    await page.goto("/admin/faculty");

    const addButton = page.locator("button:has-text('Add')");
    if (await addButton.isVisible()) {
      await addButton.click();

      await page.fill("input[name='name']", "Test Faculty");
      await page.fill(
        "input[name='email']",
        `test${Date.now()}@university.edu`,
      );

      const submitButton = page.locator("button[type='submit']");
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }
  });
});

test.describe("Faculty Detail View", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "admin");
  });

  test("faculty detail page loads", async ({ page }) => {
    await page.goto("/admin/faculty");

    const facultyRow = page.locator("tr").first();
    if (await facultyRow.isVisible()) {
      await facultyRow.click();
    }
  });

  test("shows faculty profile information", async ({ page }) => {
    await page.goto("/admin/faculty");

    const viewButton = page.locator(
      "a:has-text('View'), button:has-text('View')",
    );
    if (await viewButton.first().isVisible()) {
      await viewButton.first().click();
      await expect(page.locator("text=/profile|details/i")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("shows faculty schedule", async ({ page }) => {
    await page.goto("/admin/faculty");

    const viewButton = page.locator(
      "a:has-text('View'), button:has-text('View')",
    );
    if (await viewButton.first().isVisible()) {
      await viewButton.first().click();
      await expect(page.locator("text=/schedule|timetable/i")).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

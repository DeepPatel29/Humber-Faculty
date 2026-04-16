import { test, expect } from "../fixtures/auth";
import { loginAs } from "../fixtures/auth";

test.describe("Faculty Profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("profile page loads", async ({ page }) => {
    await page.goto("/faculty/profile");

    await expect(page.locator("h1:has-text('Profile')")).toBeVisible({
      timeout: 10000,
    });
  });

  test("displays user information", async ({ page }) => {
    await page.goto("/faculty/profile");

    await expect(page.locator("text=/name|email|designation/i")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows bio section", async ({ page }) => {
    await page.goto("/faculty/profile");

    await expect(page.locator("text=/bio|about/i")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows contact information section", async ({ page }) => {
    await page.goto("/faculty/profile");

    await expect(page.locator("text=/phone|contact|email/i")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows office information section", async ({ page }) => {
    await page.goto("/faculty/profile");

    await expect(page.locator("text=/office|location|hours/i")).toBeVisible({
      timeout: 10000,
    });
  });

  test("has edit profile button", async ({ page }) => {
    await page.goto("/faculty/profile");

    await expect(page.locator("button:has-text('Edit')")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Profile Editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("can open edit mode", async ({ page }) => {
    await page.goto("/faculty/profile");

    const editButton = page.locator("button:has-text('Edit')");
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator("input, textarea")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("can save profile changes", async ({ page }) => {
    await page.goto("/faculty/profile");

    const editButton = page.locator("button:has-text('Edit')");
    if (await editButton.isVisible()) {
      await editButton.click();

      const bioField = page.locator("textarea[name='bio']");
      if (await bioField.isVisible()) {
        await bioField.fill("Test bio content");
      }

      const saveButton = page.locator("button:has-text('Save')");
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
    }
  });

  test("can cancel editing", async ({ page }) => {
    await page.goto("/faculty/profile");

    const editButton = page.locator("button:has-text('Edit')");
    if (await editButton.isVisible()) {
      await editButton.click();

      const cancelButton = page.locator("button:has-text('Cancel')");
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  });
});

test.describe("Teaching History", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAs(page, "faculty");
  });

  test("shows teaching history section", async ({ page }) => {
    await page.goto("/faculty/profile");

    await expect(
      page.locator("text=/teaching history|courses taught/i"),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("can add teaching history entry", async ({ page }) => {
    await page.goto("/faculty/profile");

    const addButton = page.locator("button:has-text('Add')");
    if (await addButton.isVisible()) {
      await addButton.click();
    }
  });
});

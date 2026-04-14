import { test as base, Page } from "@playwright/test";

type TestUser = {
  email: string;
  password: string;
  role: "ADMIN" | "STAFF" | "SCHEDULER" | "STUDENT";
  expectedPath: string;
};

export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: "admin@university.edu",
    password: "password123",
    role: "ADMIN",
    expectedPath: "/admin/dashboard",
  },
  faculty: {
    email: "faculty@university.edu",
    password: "password123",
    role: "STAFF",
    expectedPath: "/faculty/dashboard",
  },
  scheduler: {
    email: "scheduler@university.edu",
    password: "password123",
    role: "SCHEDULER",
    expectedPath: "/scheduler/dashboard",
  },
  student: {
    email: "student@university.edu",
    password: "password123",
    role: "STUDENT",
    expectedPath: "/faculty/dashboard",
  },
};

async function mockLogin(page: Page, user: TestUser): Promise<void> {
  const response = await page.request.post("/api/auth/mock-login", {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Mock login failed for ${user.email}: ${response.status()} ${response.statusText()}`,
    );
  }

  const setCookieHeader = response.headers()["set-cookie"];
  if (setCookieHeader) {
    const cookies = setCookieHeader.split(",").flatMap((cookieLine) => {
      const parts = cookieLine.split(";").map((p) => p.trim());
      const [nameValue, ...attrs] = parts;
      if (!nameValue || !nameValue.includes("=")) return [];

      const [name, ...valueParts] = nameValue.split("=");
      const value = valueParts.join("=");

      if (!name || !value) return [];

      const cookie: {
        name: string;
        value: string;
        domain?: string;
        path?: string;
        expires?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: "Strict" | "Lax" | "None";
      } = {
        name: name.trim(),
        value: value.trim(),
        domain: "localhost",
        path: "/",
      };

      for (const attr of attrs) {
        const lowerAttr = attr.toLowerCase();
        if (lowerAttr === "httponly") cookie.httpOnly = true;
        if (lowerAttr === "secure") cookie.secure = true;
        if (lowerAttr.startsWith("path=")) cookie.path = attr.split("=")[1];
        if (lowerAttr.startsWith("expires=")) {
          const expiresStr = attr.split("=")[1];
          const expiresDate = new Date(expiresStr);
          if (!isNaN(expiresDate.getTime())) {
            cookie.expires = Math.floor(expiresDate.getTime() / 1000);
          }
        }
        if (lowerAttr.startsWith("samesite=")) {
          const sameSite = attr.split("=")[1];
          if (["Strict", "Lax", "None"].includes(sameSite)) {
            cookie.sameSite = sameSite as "Strict" | "Lax" | "None";
          }
        }
      }

      return [cookie];
    });

    if (cookies.length > 0) {
      await page.context().addCookies(cookies);
    }
  }
}

export const test = base.extend<{
  loginAsAdmin: () => Promise<void>;
  loginAsFaculty: () => Promise<void>;
  loginAsScheduler: () => Promise<void>;
}>({
  loginAsAdmin: async ({ page }, use) => {
    await use(async () => {
      await mockLogin(page, TEST_USERS.admin);
    });
  },
  loginAsFaculty: async ({ page }, use) => {
    await use(async () => {
      await mockLogin(page, TEST_USERS.faculty);
    });
  },
  loginAsScheduler: async ({ page }, use) => {
    await use(async () => {
      await mockLogin(page, TEST_USERS.scheduler);
    });
  },
});

export { expect } from "@playwright/test";

export async function loginAs(
  page: Page,
  userType: keyof typeof TEST_USERS,
): Promise<void> {
  const user = TEST_USERS[userType];
  if (!user) {
    throw new Error(`Unknown user type: ${userType}`);
  }
  await mockLogin(page, user);
}

export async function logout(page: Page): Promise<void> {
  await page.request.post("/api/auth/mock-logout");
  await page.context().clearCookies();
}

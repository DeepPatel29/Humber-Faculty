import type { NextRequest } from "next/server";
import { db } from "./db";

export interface AuthSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface AuthSession {
  user?: AuthSessionUser;
}

export interface AuthInstance {
  api: {
    getSession: (opts: { headers: Headers }) => Promise<AuthSession | null>;
  };
  handler: (req: NextRequest) => Promise<Response>;
}

let auth: AuthInstance | null = null;

if (process.env.DATABASE_URL && db) {
  try {
    // Synchronous init (matches prior require-based setup; avoids top-level await).
    const { betterAuth } = require("better-auth") as typeof import("better-auth");
    const { prismaAdapter } =
      require("better-auth/adapters/prisma") as typeof import("better-auth/adapters/prisma");

    auth = betterAuth({
      baseURL:
        process.env.BETTER_AUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000",
      database: prismaAdapter(db, { provider: "postgresql" }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: { enabled: true, maxAge: 60 * 5 },
      },
      trustedOrigins: [
        process.env.BETTER_AUTH_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          "http://localhost:3000",
      ],
    }) as AuthInstance;
  } catch (e) {
    console.warn("Better Auth init skipped:", (e as Error).message);
    auth = null;
  }
}

export { auth };

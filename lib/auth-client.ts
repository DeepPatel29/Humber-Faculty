"use client";

import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({ baseURL });

export async function signIn(credentials: { email: string; password: string }) {
  try {
    const result = await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
    });
    return result;
  } catch {
    const res = await fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return res.json();
  }
}

export async function signUp(data: { name: string; email: string; password: string }) {
  try {
    const result = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    return result;
  } catch {
    const res = await fetch("/api/auth/mock-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  }
}

export async function signOut() {
  try {
    await authClient.signOut();
  } catch {
    await fetch("/api/auth/mock-logout", { method: "POST" });
  }
}

export const useSession = authClient.useSession;

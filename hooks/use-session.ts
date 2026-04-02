"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface SessionData {
  user: SessionUser | null;
  isLoading: boolean;
  error: string | null;
}

let cachedSession: SessionUser | null | undefined = undefined;
let fetchPromise: Promise<SessionUser | null> | null = null;

async function fetchSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/get-session", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user || null;
  } catch {
    return null;
  }
}

export function useSessionData(): SessionData {
  const [user, setUser] = useState<SessionUser | null>(cachedSession ?? null);
  const [isLoading, setIsLoading] = useState(cachedSession === undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedSession !== undefined) {
      setUser(cachedSession);
      setIsLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchSession();
    }

    let mounted = true;

    fetchPromise
      .then((result) => {
        cachedSession = result;
        fetchPromise = null;
        if (mounted) {
          setUser(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        cachedSession = null;
        fetchPromise = null;
        if (mounted) {
          setUser(null);
          setIsLoading(false);
          setError("Failed to fetch session");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { user, isLoading, error };
}

export function clearSessionCache() {
  cachedSession = undefined;
  fetchPromise = null;
}

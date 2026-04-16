"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ROLES } from "@/lib/types/roles";

function redirectAfterLogin(sessionUser: { role?: string | null }) {
  const r =
    typeof sessionUser.role === "string"
      ? sessionUser.role.trim().toUpperCase()
      : "";
  if (r === ROLES.ADMIN) {
    window.location.href = "/admin/dashboard";
    return;
  }
  if (r === ROLES.SCHEDULER) {
    window.location.href = "/scheduler/dashboard";
    return;
  }
  window.location.href = "/faculty/dashboard";
}

/** Use server session (Better Auth + get-session rules) so redirects match who is actually signed in. */
async function redirectUsingGetSession(): Promise<void> {
  try {
    const res = await fetch("/api/auth/get-session", { credentials: "include" });
    const data = (await res.json().catch(() => null)) as {
      user?: { role?: string | null } | null;
    } | null;
    const u = data?.user;
    if (u) {
      redirectAfterLogin({ role: u.role ?? undefined });
      return;
    }
  } catch {
    /* fall through */
  }
  window.location.href = "/faculty/dashboard";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    const testEmails = [
      "admin@university.edu",
      "faculty@university.edu",
      "scheduler@university.edu",
    ];

    if (testEmails.includes(trimmedEmail) && password === "password123") {
      try {
        const res = await fetch("/api/auth/mock-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password }),
          credentials: "include",
        });
        const data = await res.json();
        const sessionUser = data.data?.user ?? data.user;
        if (sessionUser) {
          toast.success("Welcome back!");
          redirectAfterLogin(sessionUser);
          return;
        }
        toast.error(data.error?.message || "Login failed");
        setIsLoading(false);
        return;
      } catch {
        toast.error("Login failed");
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back!");
      await redirectUsingGetSession();
      return;
    } catch {
      try {
        const res = await fetch("/api/auth/mock-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password }),
          credentials: "include",
        });
        const data = await res.json();
        const sessionUser = data.data?.user ?? data.user;
        if (sessionUser) {
          toast.success("Welcome back!");
          redirectAfterLogin(sessionUser);
          return;
        }
        toast.error(data.error?.message || "Invalid credentials");
      } catch {
        toast.error("Login failed. Please try again.");
      }
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Welcome back</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your credentials to access your dashboard
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              placeholder="you@university.edu"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div
              className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ${
                focusedField === "email" ? "w-full" : "w-0"
              }`}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-10 text-foreground shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div
              className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ${
                focusedField === "password" ? "w-full" : "w-0"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}

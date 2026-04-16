"use client";

import { useSession, signIn, signOut, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role?: string;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export function useAuth() {
  const { data: session, isPending, error } = useSession();

  return {
    user: session?.user as User | undefined,
    session,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
  };
}

export function useAuthSignUp() {
  const router = useRouter();

  const signUpUser = async (input: { email: string; password: string; name: string }) => {
    try {
      const result = await signUp({
        email: input.email,
        password: input.password,
        name: input.name,
      });

      if (result.error) {
        throw new Error(result.error.message || "Sign up failed");
      }

      router.push("/faculty/dashboard");
      router.refresh();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  };

  return { signUp: signUpUser };
}

export function useAuthSignIn() {
  const router = useRouter();

  const signInUser = async (input: { email: string; password: string }) => {
    try {
      const result = await signIn({
        email: input.email,
        password: input.password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Sign in failed");
      }

      router.push("/faculty/dashboard");
      router.refresh();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  };

  return { signIn: signInUser };
}

export function useAuthSignOut() {
  const router = useRouter();

  const signOutUser = async () => {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      };
    }
  };

  return { signOut: signOutUser };
}

export { useSession, signIn, signOut, signUp };

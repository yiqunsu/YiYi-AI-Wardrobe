/**
 * Authentication context provider.
 * Wraps the app with Supabase auth state — current user, loading flag,
 * and methods for login, register (email/password), Google OAuth, and logout.
 * Exposes a useAuth() hook for consuming components.
 */
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/db/client";
import type {
  User as SupabaseUser,
  Session,
  AuthChangeEvent,
} from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const transformUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name:
      supabaseUser.user_metadata?.name ||
      supabaseUser.user_metadata?.full_name,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(transformUser(session?.user ?? null));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(transformUser(session?.user ?? null));
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = "Sign in failed";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email first";
        } else {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (data.user) {
        setUser(transformUser(data.user));
      }
    } catch (error: unknown) {
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    name?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || undefined,
            full_name: name || undefined,
          },
        },
      });

      if (error) {
        let errorMessage = "Registration failed";
        if (error.message.includes("User already registered")) {
          errorMessage = "This email is already registered";
        } else if (error.message.includes("Password")) {
          errorMessage = "Password does not meet requirements";
        } else {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (data.user) {
        if (data.user && !data.session) {
          throw new Error(
            "Registration successful! Please check your email to confirm your account before signing in."
          );
        }
        setUser(transformUser(data.user));
      }
    } catch (error: unknown) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message || "Google sign in failed");
      }
    } catch (error: unknown) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

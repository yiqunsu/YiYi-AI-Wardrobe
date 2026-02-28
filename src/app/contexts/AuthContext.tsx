"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User as SupabaseUser, Session, AuthChangeEvent } from "@supabase/supabase-js";

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

/**
 * 将 Supabase 用户对象转换为应用所需的用户格式。
 * 主要用于提取 id、email 和姓名等信息，保持前端 User 数据结构统一。
 */
const transformUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
  };
};

/**
 * AuthProvider 组件用于提供用户认证状态上下文。
 * 包含用户数据、加载状态和各种认证操作方法（登录、注册、登出等）。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 初始化时检测当前会话，并监听认证状态变化。
   * 会话发生变化时自动更新 user 和 loading 状态。
   */
  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(transformUser(session?.user ?? null));
      setLoading(false);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(transformUser(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * 使用邮箱和密码进行登录操作。
   * 登录成功会设置 user，会抛出典型错误信息用于前端提示。
   * @param email 用户邮箱
   * @param password 用户密码
   */
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // 处理常见的 Supabase 登录错误信息
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
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * 用户注册新账号。
   * 可填写邮箱、密码和可选用户名。若需邮箱确认则抛出特殊提示。
   * @param email 邮箱
   * @param password 密码
   * @param name 用户名（可选）
   */
  const register = async (email: string, password: string, name?: string) => {
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
        // 判断是否需要邮件确认激活账号
        if (data.user && !data.session) {
          throw new Error("Registration successful! Please check your email to confirm your account before signing in.");
        }
        setUser(transformUser(data.user));
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * 通过 Google OAuth 第三方服务登录。
   * 跳转到 Google 登录页后，回调地址返回认证状态由监听处理。
   */
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

      // OAuth 登录会跳转，回调页和 onAuthStateChange 负责进一步处理
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * 用户登出当前账号。
   * 清理本地 user 状态。发生错误时打印错误信息。
   */
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

/**
 * useAuth 是一个自定义 Hook，便于组件内获取认证上下文。
 * 只能在 AuthProvider 组件内部调用，否则抛出异常。
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

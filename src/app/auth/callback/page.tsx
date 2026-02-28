"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    /**
     * 检查用户是否已经完成 OAuth 登录流程并获取到了 session。
     * 如果获取到 session，说明登录完成，跳转到服务主页面；
     * 如果暂时没有获取到，说明 OAuth 回调还未生效，则尝试轮询等待；
     * 若出现错误，2 秒后跳转到登录页。
     */
    const checkSession = async () => {
      try {
        // 首次尝试获取 session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // 获取 session 出现错误，2 秒后跳转到登录页
          console.error("Session check error:", error);
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
          return;
        }

        if (session) {
          // session 存在，说明用户已登录，立即跳转到服务页
          router.push("/service/create");
          router.refresh();
        } else {
          // 没有 session，说明 OAuth 回调未及时完成，轮询重试最多 3 次
          let attempts = 0;
          const maxAttempts = 3;

          const retryCheck = setInterval(async () => {
            attempts++;
            // 再次尝试获取 session
            const { data: { session: retrySession } } = await supabase.auth.getSession();

            if (retrySession) {
              // 轮询获取到 session，清除定时器并跳转
              clearInterval(retryCheck);
              router.push("/service/create");
              router.refresh();
            } else if (attempts >= maxAttempts) {
              // 轮询指定次数仍无 session，跳转回登录页
              clearInterval(retryCheck);
              router.push("/auth/login");
            }
          }, 1000);
        }
      } catch (error) {
        // 代码执行出现异常，2 秒后跳转到登录页
        console.error("Auth callback error:", error);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    };

    // 组件挂载时立即检查 session
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f7f1e8] flex items-center justify-center">
      <div className="text-center">
        {/* 加载动画 + 状态提示 */}
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B5E3C] border-r-transparent"></div>
        <p className="mt-4 text-stone-600">Completing sign in...</p>
      </div>
    </div>
  );
}

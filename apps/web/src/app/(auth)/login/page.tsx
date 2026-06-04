"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toJapaneseAuthError } from "@/lib/auth-error";
import { LoginSchema, type Login } from "@sakubun-zemi/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (values: Login) => {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(toJapaneseAuthError(error.message));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const inputBase =
    "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm text-ink focus:outline-none focus:border-brand focus:bg-white transition-all";
  const inputError =
    "w-full px-4 py-3.5 rounded-xl border-2 border-red-300 bg-red-50/30 text-sm text-ink focus:outline-none focus:border-red-400 focus:bg-white transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-brand-texture">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-brand-dark mx-auto flex items-center justify-center mb-4">
            <Pen size={36} stroke="white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-bg">
            さくぶんゼミ
          </h1>
          <p className="text-sm mt-1 text-bg/60">AIで作文力を伸ばそう</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-soft-lg p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-muted">
                メールアドレス
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                className={errors.email ? inputError : inputBase}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-muted">
                パスワード
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="パスワードを入力"
                autoComplete="current-password"
                className={errors.password ? inputError : inputBase}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-scale-in">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-brand-dark text-bg font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-all duration-200 hover:bg-brand"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-muted">
              アカウントをお持ちでない方は{" "}
              <Link
                href="/signup"
                className="font-semibold hover:underline text-brand-dark"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

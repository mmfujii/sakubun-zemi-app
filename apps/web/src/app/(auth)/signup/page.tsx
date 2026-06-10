"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Signup, SignupSchema } from "@sakubun-zemi/schemas";
import { Loader2, Mail, Pen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toJapaneseAuthError } from "@/lib/auth-error";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Signup>({
    resolver: zodResolver(SignupSchema),
  });

  const onSubmit = async (values: Signup) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setServerError(toJapaneseAuthError(error.message));
      return;
    }

    setSentEmail(values.email);
    setEmailSent(true);
  };

  const inputBase =
    "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm text-ink focus:outline-none focus:border-brand focus:bg-white transition-all";
  const inputError =
    "w-full px-4 py-3.5 rounded-xl border-2 border-red-300 bg-red-50/30 text-sm text-ink focus:outline-none focus:border-red-400 focus:bg-white transition-all";

  // Email sent confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-brand-texture">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="bg-white rounded-3xl shadow-soft-lg p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-light mx-auto flex items-center justify-center mb-4">
              <Mail color="var(--color-brand-dark)" size={28} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight mb-2 text-ink">
              メールを確認してください
            </h1>
            <p className="text-sm leading-relaxed mb-1 text-muted">
              <span className="font-semibold text-ink">{sentEmail}</span> に
            </p>
            <p className="text-sm leading-relaxed mb-6 text-muted">
              確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
            </p>
            <p className="text-xs text-muted/70">
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-brand-texture">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-dark mx-auto flex items-center justify-center mb-3">
            <Pen size={28} stroke="white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-bg">アカウント登録</h1>
          <p className="text-xs mt-1 text-bg/60">さくぶんゼミをはじめよう</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-soft-lg p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="text-xs font-semibold mb-1.5 block text-muted">
                メールアドレス
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                placeholder="example@email.com"
                autoComplete="email"
                className={errors.email ? inputError : inputBase}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-xs font-semibold mb-1.5 block text-muted">
                パスワード
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                placeholder="8文字以上のパスワード"
                autoComplete="new-password"
                className={errors.password ? inputError : inputBase}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Password confirm */}
            <div>
              <label
                htmlFor="passwordConfirm"
                className="text-xs font-semibold mb-1.5 block text-muted"
              >
                パスワード（確認）
              </label>
              <input
                {...register("passwordConfirm")}
                id="passwordConfirm"
                type="password"
                placeholder="もう一度入力してください"
                autoComplete="new-password"
                className={errors.passwordConfirm ? inputError : inputBase}
              />
              {errors.passwordConfirm && (
                <p className="mt-1 text-xs text-red-500">{errors.passwordConfirm.message}</p>
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
                  登録中...
                </span>
              ) : (
                "登録する"
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-muted">
              すでにアカウントをお持ちの方は{" "}
              <Link href="/login" className="font-semibold hover:underline text-brand-dark">
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

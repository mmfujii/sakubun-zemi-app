/**
 * Converts Supabase Auth error messages to user-friendly Japanese strings.
 */
export function toJapaneseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません";
  }
  if (lower.includes("email not confirmed")) {
    return "メールアドレスが確認されていません。確認メールをご確認ください";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "このメールアドレスはすでに登録されています";
  }
  if (lower.includes("password should be at least")) {
    return "パスワードは8文字以上で入力してください";
  }
  if (lower.includes("unable to validate email address")) {
    return "有効なメールアドレスを入力してください";
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return "しばらく時間をおいてから再度お試しください";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "通信エラーが発生しました。接続を確認してください";
  }

  // Fallback: return the original message
  return message;
}

"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function InquiryForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !message.trim()) {
      setError("件名と内容を入力してください");
      return;
    }

    setSending(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "送信に失敗しました");
        return;
      }
      setSent(true);
      setSubject("");
      setMessage("");
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-3">
          <Check size={24} stroke="#2f6e59" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-bold text-gray-900 mb-1">送信しました</p>
        <p className="text-xs text-gray-500 mb-4">通常2営業日以内にご返信いたします</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-xs text-brand font-medium hover:underline"
        >
          別の問い合わせをする
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="space-y-3">
        <div>
          <label htmlFor="subject" className="block text-xs font-medium text-gray-600 mb-1">
            件名
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="例: 添削結果が表示されません"
            maxLength={100}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-xs font-medium text-gray-600 mb-1">
            内容
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="お困りの内容を詳しくお書きください"
            rows={5}
            maxLength={2000}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{message.length}/2000</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="mt-4 w-full py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? "送信中..." : "送信する"}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">通常2営業日以内にご返信いたします</p>
    </form>
  );
}

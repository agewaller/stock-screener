"use client";

import { useState } from "react";
import { ALL_CATEGORIES } from "@/lib/types";
import AlertPreferenceForm, { type AlertPreferenceState } from "./AlertPreferenceForm";
import EmailStatusMessage from "./EmailStatusMessage";

const DEFAULT_PREFS: AlertPreferenceState = {
  alertMinLevel: 2,
  spikeAlertsEnabled: true,
  categories: [...ALL_CATEGORIES],
};

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [prefs, setPrefs] = useState<AlertPreferenceState>(DEFAULT_PREFS);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message: string;
  }>({ kind: "idle", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus({ kind: "idle", message: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          // honeypot: real users leave this empty.
          website: hp,
          alert_min_level: prefs.alertMinLevel,
          spike_enabled: prefs.spikeAlertsEnabled,
          categories: prefs.categories,
        }),
      });
      if (!res.ok && res.status !== 200) {
        // do not leak error details
        setStatus({
          kind: "error",
          message: "登録処理に失敗しました。時間をおいて再度お試しください。",
        });
      } else {
        setStatus({
          kind: "success",
          message:
            "確認メールを送信しました。メール内のリンクをクリックすると登録が完了します。",
        });
        setEmail("");
      }
    } catch {
      setStatus({
        kind: "error",
        message: "登録処理に失敗しました。時間をおいて再度お試しください。",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-riskText/90 leading-relaxed">
        リスク指数が設定値を超えた場合、または急上昇した場合にメールで通知します。通知は公開情報に基づく自動アラートであり、戦争発生を予言・断定するものではありません。
      </p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md bg-riskBg border border-riskBorder px-3 py-2 text-sm"
          placeholder="you@example.com"
        />
      </div>

      {/* Honeypot — visually hidden, ignored by humans, filled by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website (do not fill)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>
      </div>

      <AlertPreferenceForm value={prefs} onChange={setPrefs} />

      <p className="text-xs text-riskMuted">
        本フォームを送信すると、確認メールが届きます。メール内のリンクをクリックして登録を完了してください（ダブルオプトイン）。いつでも解除リンクから配信停止できます。
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2 text-sm font-medium"
      >
        {submitting ? "送信中…" : "確認メールを送信"}
      </button>

      {status.kind === "success" && (
        <EmailStatusMessage variant="success">{status.message}</EmailStatusMessage>
      )}
      {status.kind === "error" && (
        <EmailStatusMessage variant="error">{status.message}</EmailStatusMessage>
      )}
    </form>
  );
}

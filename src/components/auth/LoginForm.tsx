"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogIn } from "lucide-react";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const router = useRouter();
  const [email, setEmail] = useState("advisor1@madkhol.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } else {
      setError(t("loginError"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          {t("email")}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          dir="ltr"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t("password")}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          dir="ltr"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={loading} className="btn-gradient w-full">
        <LogIn className="w-4 h-4" />
        {loading ? "…" : t("submit")}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(data.error || "Login failed. Check your email and password.");
      return;
    }

    router.push("/planner");
    router.refresh(); // re-renders server components so navbar picks up new session
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#FFFBF5] px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#F97316]">Welcome back</p>
        <h1 className="mb-2 text-3xl font-extrabold text-[#1C1917]">Log In</h1>
        <p className="mb-8 text-sm text-[#78716C]">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-[#F97316] hover:underline">
            Sign up free
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#78716C]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#E0D4C4] bg-white px-3 py-2.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none focus:border-[#F97316]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#78716C]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[#E0D4C4] bg-white px-3 py-2.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none focus:border-[#F97316]"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#F97316] py-3 text-sm font-bold text-white transition-all hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#A8A29E]">
          Your data is private. We only use it to personalize your recipe planner.
        </p>
      </div>
    </div>
  );
}

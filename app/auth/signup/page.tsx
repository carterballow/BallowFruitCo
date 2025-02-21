"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(data.error || "Signup failed. Please try again.");
      return;
    }

    setSuccess(true);
  };

  // After signup, Supabase sends a confirmation email.
  // Show a "check your inbox" screen instead of auto-logging in.
  if (success) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#FFFBF5] px-6 text-center">
        <div className="w-full max-w-sm rounded-2xl border border-[#F0E8DC] bg-white p-8 card-shadow">
          <div className="mb-4 text-4xl">✉</div>
          <h1 className="mb-2 text-2xl font-bold text-[#1C1917]">Check your email</h1>
          <p className="mb-6 text-sm text-[#78716C]">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.
          </p>
          <Link
            href="/auth/login"
            className="inline-block rounded-xl bg-[#F97316] px-7 py-3 text-sm font-bold text-white hover:bg-[#EA580C]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#FFFBF5] px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#F97316]">Create account</p>
        <h1 className="mb-2 text-3xl font-extrabold text-[#1C1917]">Sign Up</h1>
        <p className="mb-8 text-sm text-[#78716C]">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[#F97316] hover:underline">
            Log in
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
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-[#E0D4C4] bg-white px-3 py-2.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none focus:border-[#F97316]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#78716C]">Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#A8A29E]">
          Your data is private. We only use it to personalize your recipe planner.
        </p>
      </div>
    </div>
  );
}

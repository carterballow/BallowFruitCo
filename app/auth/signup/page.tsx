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
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setIsLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setIsLoading(false);
    if (!res.ok) { setError(data.error || "Signup failed. Please try again."); return; }
    setSuccess(true);
  };

  const inputClass = "w-full border border-[#E2D9CE] bg-[#F8F5F0] px-3 py-2.5 text-sm text-[#111111] placeholder-[#C8B9A8] outline-none focus:border-[#111111] transition-colors";
  const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]";

  if (success) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#F8F5F0] px-6 text-center">
        <div className="w-full max-w-sm border border-[#E2D9CE] bg-white p-8">
          <p className="mb-4 text-3xl">✉</p>
          <h1 className="mb-2 text-2xl font-light text-[#111111]">Check your email</h1>
          <p className="mb-6 text-sm text-[#6B6560]">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then log in.
          </p>
          <Link href="/auth/login" className="inline-block bg-[#111111] px-7 py-3 text-sm font-medium text-white hover:bg-[#C8510A] transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#F8F5F0] px-6">
      <div className="w-full max-w-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Create account</p>
        <h1 className="mb-1 text-3xl font-light text-[#111111]">Sign Up</h1>
        <p className="mb-8 text-sm text-[#6B6560]">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#111111] underline underline-offset-2 hover:text-[#C8510A]">
            Log in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass} />
          </div>

          {error && <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#111111] py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#C8510A] disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#9C9490]">
          Your data is private and only used to personalize your recipe planner.
        </p>
      </div>
    </div>
  );
}

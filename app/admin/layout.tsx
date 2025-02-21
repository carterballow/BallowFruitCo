"use client";

import { useState, useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already logged in this session
    const stored = sessionStorage.getItem("admin_authed");
    if (stored === "true") setAuthed(true);
    setChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      // Store both the auth flag and the password so API requests can include it
      sessionStorage.setItem("admin_authed", "true");
      sessionStorage.setItem("admin_pw", password);
      setAuthed(true);
    } else {
      setError("Incorrect password.");
    }
  };

  if (checking) return null;

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <span className="text-4xl">🔐</span>
            <h1 className="mt-3 text-2xl font-bold text-[#ededed]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#6b7280]">Ballow Fruit Co. — Orders</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-md border border-[#242424] bg-[#141414] px-4 py-3 text-[#ededed] placeholder-[#4b5563] focus:border-[#FF6B00] focus:outline-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-[#FF6B00] py-3 font-semibold text-black hover:bg-[#FF8C00]"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-[#FF6B00]/20 bg-[#141414] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="font-bold text-[#FF6B00]">
            🍊 Admin — Ballow Fruit Co.
          </span>
          <button
            onClick={() => {
              sessionStorage.removeItem("admin_authed");
              setAuthed(false);
            }}
            className="text-sm text-[#6b7280] hover:text-[#ededed]"
          >
            Log out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const router = useRouter();

  // Already signed in? Skip the login screen. A lockout on this client beats
  // the session and keeps the form shut until it expires.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.lockedUntil) setLockedUntil(data.lockedUntil);
        else if (data?.authenticated === true) router.replace("/admin/dashboard");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Wrong password. Try again.");
        if (data.lockedUntil) setLockedUntil(data.lockedUntil);
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // The lock is lifted automatically once it expires, so the form reopens
  // without a reload.
  useEffect(() => {
    if (!lockedUntil) return;
    const remaining = new Date(lockedUntil).getTime() - Date.now();
    const timer = setTimeout(() => setLockedUntil(null), Math.max(remaining, 0));
    return () => clearTimeout(timer);
  }, [lockedUntil]);

  const locked = lockedUntil !== null;
  const lockedText = lockedUntil
    ? `Access blocked until ${new Date(lockedUntil).toLocaleString()}.`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm px-6 animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3"><Image src="/logo-light.png" alt="SneakerVault" width={64} height={64} className="h-16 w-16 rounded-xl object-cover" /><h1 className="text-2xl font-bold tracking-tight text-gray-900">SneakerVault</h1></div>
            <p className="text-sm text-gray-500">Admin login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={locked}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {locked && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">{lockedText}</p>
            )}

            {!locked && error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading || !password || locked}
              className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-all duration-200 btn-press"
            >
              {locked ? "Access blocked" : loading ? "Logging in..." : "Sign in"}
            </button>
          </form>

          <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to the store
          </Link>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Auth from "@aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // @ts-ignore - use runtime call; types for @aws-amplify/auth vary by version
      await (Auth as any).signIn(username, password);
      // on success redirect to root
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-secondary-500 to-primary-400 p-6">
      <form
        onSubmit={handleSignIn}
        className="w-full max-w-md bg-white/95 rounded-2xl p-8 shadow-md"
      >
        <h2 className="text-2xl font-bold mb-4">Sign in</h2>

        {error && <div className="text-red-600 mb-3">{error}</div>}

        <label className="block mb-2">
          <span className="text-sm">Username</span>
          <input
            className="mt-1 block w-full rounded-md border px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="mt-1 block w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="w-full bg-primary-500 text-white py-2 rounded-md"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

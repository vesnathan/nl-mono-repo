"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Link href="/login">
        <button
          type="button"
          className="px-6 py-3 rounded bg-primary-600 text-white"
        >
          Log in
        </button>
      </Link>
    </main>
  );
}

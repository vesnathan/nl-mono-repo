"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-secondary-500 to-primary-400 p-6">
      <div className="max-w-xl w-full bg-white/95 rounded-2xl p-8 shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Cloud Watch Live</h1>
        <p className="text-gray-600 mb-6">
          Minimal starter template. Use the login route to sign in with your
          Cognito user.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 bg-primary-500 text-white rounded-md"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { shouldUseLocalData, toggleLocalData } from "@/lib/local-data";

export function LocalDataToggle() {
  const [isLocal, setIsLocal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLocal(shouldUseLocalData());
  }, []);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Only show in dev stage or when STAGE is not set (local development)
  const stage = process.env.NEXT_PUBLIC_STAGE;
  if (stage && stage !== "dev") {
    return null;
  }

  const handleToggle = () => {
    const newValue = toggleLocalData();
    setIsLocal(newValue);
    // Reload to apply changes
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        type="button"
        onClick={handleToggle}
        className={`
          px-4 py-2 rounded-lg shadow-lg font-medium text-sm
          transition-all duration-200 hover:scale-105
          ${
            isLocal
              ? "bg-yellow-500 text-black hover:bg-yellow-400"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }
        `}
        title={
          isLocal
            ? "Using local/seed data - Click to use live database"
            : "Using live database - Click to use local/seed data"
        }
      >
        {isLocal ? "📦 Local Data" : "🌐 Live Data"}
      </button>
    </div>
  );
}

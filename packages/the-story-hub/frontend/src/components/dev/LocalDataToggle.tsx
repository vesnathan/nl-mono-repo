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

  // Only show in dev stage
  if (process.env.NEXT_PUBLIC_STAGE !== "dev") {
    return null;
  }

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
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

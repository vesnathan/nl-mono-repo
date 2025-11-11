"use client";

import { useState, useEffect } from "react";

interface AudioDownloadButtonProps {
  audioCache: Map<string, string>; // cacheKey -> blobUrl
}

/**
 * Dev-only floating button to download all generated audio files
 * Shows count of available files and allows bulk download
 */
export default function AudioDownloadButton({
  audioCache,
}: AudioDownloadButtonProps) {
  const [count, setCount] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Poll the cache for blob URLs (downloadable files) every second
  useEffect(() => {
    const interval = setInterval(() => {
      const entries = Array.from(audioCache.entries());
      const blobCount = entries.filter(([, url]) =>
        url.startsWith("blob:"),
      ).length;
      setCount(blobCount);
    }, 1000);

    return () => clearInterval(interval);
  }, [audioCache]);

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleDownload = async () => {
    if (audioCache.size === 0) {
      alert("No audio files generated yet. Play the game to generate audio!");
      return;
    }

    setIsDownloading(true);

    try {
      // Download each file individually (browser limitation - can't create zip in pure JS easily)
      const entries = Array.from(audioCache.entries());

      // Filter out pre-generated files (they start with /audio/generated/)
      // Only download dynamically generated blob URLs
      const blobEntries = entries.filter(([, url]) => url.startsWith("blob:"));

      if (blobEntries.length === 0) {
        alert(
          "No dynamically generated audio to download. All audio is using pre-generated files!",
        );
        return;
      }

      for (const [cacheKey, blobUrl] of blobEntries) {
        // Parse cache key to get characterId and text
        const [voiceId, text] = cacheKey.split(":");

        // Create safe filename
        const safeText = text
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .substring(0, 50);
        const filename = `${voiceId}_${safeText}.mp3`;

        // Fetch blob and trigger download with proper MIME type
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        const mp3Blob = new Blob([blob], { type: "audio/mpeg" });

        const a = document.createElement("a");
        a.href = URL.createObjectURL(mp3Blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up the object URL
        URL.revokeObjectURL(a.href);

        // Small delay between downloads to avoid browser blocking
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      alert(
        `Downloaded ${blobEntries.length} audio files! Extract them to /public/audio/generated/`,
      );

      // Remove blob URLs from cache after successful download
      blobEntries.forEach(([cacheKey]) => {
        audioCache.delete(cacheKey);
      });

      // Update count immediately
      setCount(0);
    } catch (error) {
      console.error("Error downloading audio files:", error);
      alert("Error downloading files. Check console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        backgroundColor: "#1a1a1a",
        border: "2px solid #00ff00",
        borderRadius: "8px",
        padding: "12px 16px",
        color: "#00ff00",
        fontFamily: "monospace",
        fontSize: "14px",
        cursor: isDownloading ? "wait" : "pointer",
        boxShadow: "0 4px 12px rgba(0, 255, 0, 0.3)",
        transition: "all 0.2s",
        opacity: isDownloading ? 0.6 : 1,
      }}
      onClick={handleDownload}
      onMouseEnter={(e) => {
        if (!isDownloading) {
          e.currentTarget.style.backgroundColor = "#2a2a2a";
          e.currentTarget.style.transform = "scale(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#1a1a1a";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px" }}>💾</span>
        <div>
          <div style={{ fontWeight: "bold" }}>
            {isDownloading ? "Downloading..." : "Download Audio"}
          </div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>
            {count} file{count !== 1 ? "s" : ""}{" "}
            {count === 0 ? "cached" : "ready"}
          </div>
        </div>
      </div>
    </div>
  );
}

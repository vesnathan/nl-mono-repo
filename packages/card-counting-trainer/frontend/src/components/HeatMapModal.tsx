"use client";

import { HeatMapBucket } from "@/hooks/useHeatMap";

interface HeatMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  heatMapBuckets: HeatMapBucket[];
  discretionScore: number;
  dataPointCount: number;
}

export default function HeatMapModal({
  isOpen,
  onClose,
  heatMapBuckets,
  discretionScore,
  dataPointCount,
}: HeatMapModalProps) {
  if (!isOpen) return null;

  // Get score color and interpretation
  const getScoreInfo = () => {
    if (discretionScore >= 80) {
      return {
        color: "#4CAF50",
        label: "EXCELLENT",
        message: "Pit boss proximity appears random. Great camouflage!",
      };
    }
    if (discretionScore >= 60) {
      return {
        color: "#8BC34A",
        label: "GOOD",
        message: "Minor correlation detected. Keep varying your play.",
      };
    }
    if (discretionScore >= 40) {
      return {
        color: "#FFC107",
        label: "FAIR",
        message: "Pit boss seems to track your betting patterns.",
      };
    }
    if (discretionScore >= 20) {
      return {
        color: "#FF9800",
        label: "POOR",
        message: "Strong correlation between count and pit boss attention!",
      };
    }
    return {
      color: "#F44336",
      label: "OBVIOUS",
      message: "Pit boss is clearly following your count. Add camouflage!",
    };
  };

  const scoreInfo = getScoreInfo();

  // Find max avgDistance for scaling bars
  const maxAvgDistance = Math.max(
    ...heatMapBuckets.map((b) => b.avgDistance),
    50, // Minimum scale
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "3px solid #333",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "#FFF", margin: 0, fontSize: "24px" }}>
            📊 Pit Boss Heat Map
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "2px solid #666",
              color: "#FFF",
              fontSize: "20px",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Discretion Score */}
        <div
          style={{
            backgroundColor: "#222",
            border: `2px solid ${scoreInfo.color}`,
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#AAA",
              marginBottom: "8px",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            Discretion Score
          </div>
          <div
            style={{
              fontSize: "36px",
              color: scoreInfo.color,
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            {discretionScore}
            <span style={{ fontSize: "16px", marginLeft: "8px" }}>
              {scoreInfo.label}
            </span>
          </div>
          <div style={{ fontSize: "14px", color: "#CCC", fontStyle: "italic" }}>
            {scoreInfo.message}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#888",
              marginTop: "8px",
            }}
          >
            Based on {dataPointCount} hands analyzed
          </div>
        </div>

        {/* Explanation */}
        <div
          style={{
            backgroundColor: "#222",
            border: "1px solid #444",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#CCC",
          }}
        >
          <strong style={{ color: "#FFF" }}>How to read this chart:</strong>
          <br />
          This heat map shows how close the pit boss gets at different count
          levels. If the bar is longer during positive counts (+2, +3, +4), the
          pit boss is tracking your betting pattern. Good camouflage shows
          random proximity regardless of count.
        </div>

        {/* Heat Map Bars */}
        {heatMapBuckets.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#888",
              fontSize: "14px",
            }}
          >
            Not enough data yet. Play more hands to generate heat map.
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#AAA",
                marginBottom: "12px",
                fontWeight: "bold",
              }}
            >
              PIT BOSS PROXIMITY BY TRUE COUNT
            </div>
            {heatMapBuckets.map((bucket) => {
              const barWidth = (bucket.avgDistance / maxAvgDistance) * 100;
              const isPositive = bucket.countRange.startsWith("+");
              const isNegative = bucket.countRange.startsWith("-");

              return (
                <div
                  key={bucket.countRange}
                  style={{
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* Count label */}
                  <div
                    style={{
                      width: "100px",
                      fontSize: "12px",
                      color: isPositive
                        ? "#4CAF50"
                        : isNegative
                          ? "#F44336"
                          : "#FFF",
                      fontWeight: "bold",
                      textAlign: "right",
                      paddingRight: "12px",
                    }}
                  >
                    {bucket.countRange}
                  </div>

                  {/* Bar */}
                  <div style={{ flex: 1, position: "relative" }}>
                    <div
                      style={{
                        height: "24px",
                        backgroundColor: "#333",
                        borderRadius: "4px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${barWidth}%`,
                          backgroundColor: isPositive
                            ? "#FF5722"
                            : isNegative
                              ? "#2196F3"
                              : "#9E9E9E",
                          transition: "width 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#FFF",
                            fontWeight: "bold",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          {bucket.avgDistance}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sample count */}
                  <div
                    style={{
                      width: "60px",
                      fontSize: "11px",
                      color: "#888",
                      textAlign: "center",
                    }}
                  >
                    ({bucket.samples})
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            color: "#AAA",
            paddingTop: "12px",
            borderTop: "1px solid #333",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                backgroundColor: "#2196F3",
                marginRight: "6px",
                verticalAlign: "middle",
              }}
            />
            Negative Count
          </div>
          <div>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                backgroundColor: "#9E9E9E",
                marginRight: "6px",
                verticalAlign: "middle",
              }}
            />
            Neutral Count
          </div>
          <div>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                backgroundColor: "#FF5722",
                marginRight: "6px",
                verticalAlign: "middle",
              }}
            />
            Positive Count (Favorable)
          </div>
        </div>
      </div>
    </div>
  );
}

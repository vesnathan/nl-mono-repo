"use client";

interface TableOverlayProps {
  message: string;
  size?: "large" | "small";
}

export default function TableOverlay({
  message,
  size = "large",
}: TableOverlayProps) {
  const fontSize = size === "large" ? "440%" : "181%";
  const marginTop = size === "small" ? "-6%" : "0";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        top: "20%",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight: "bold",
          marginTop,
        }}
      >
        <svg viewBox="0 0 1080 100">
          <defs>
            <path
              id="curve"
              d="M153.571,41.41c8.493,2.314,139.052,36.732,379.157,36.276 c236.284-0.453,362.599-34.265,371.728-36.808"
              fill="transparent"
            />
          </defs>
          <text
            width="1080"
            fill="rgba(255,255,255,0.2)"
            fontSize={size === "large" ? "48" : "28"}
          >
            <textPath href="#curve" startOffset="50%" textAnchor="middle">
              {message}
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  );
}

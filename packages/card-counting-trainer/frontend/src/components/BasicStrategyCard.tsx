"use client";

import { GameSettings } from "@/types/gameSettings";
import { StrategyAction } from "@/types/game";

interface BasicStrategyCardProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
}

export default function BasicStrategyCard({
  isOpen,
  onClose,
  settings,
}: BasicStrategyCardProps) {
  if (!isOpen) return null;

  const getActionColor = (action: StrategyAction): string => {
    switch (action) {
      case "H":
        return "#3B82F6";
      case "S":
        return "#EF4444";
      case "D":
        return "#10B981";
      case "SP":
        return "#F59E0B";
      case "SU":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const hardTotals = [
    {
      player: "17+",
      actions: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    },
    {
      player: "16",
      actions: ["S", "S", "S", "S", "S", "H", "H", "SU", "SU", "SU"],
    },
    {
      player: "15",
      actions: ["S", "S", "S", "S", "S", "H", "H", "H", "SU", "H"],
    },
    {
      player: "13-14",
      actions: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
    },
    {
      player: "12",
      actions: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
    },
    {
      player: "11",
      actions: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D"],
    },
    {
      player: "10",
      actions: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
    },
    {
      player: "9",
      actions: settings.dealerHitsSoft17
        ? ["D", "D", "D", "D", "D", "H", "H", "H", "H", "H"]
        : ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    },
    {
      player: "5-8",
      actions: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
    },
  ];

  const softTotals = [
    {
      player: "A,9",
      actions: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    },
    {
      player: "A,8",
      actions: settings.dealerHitsSoft17
        ? ["S", "D", "D", "D", "D", "S", "S", "S", "S", "S"]
        : ["S", "S", "D", "D", "D", "S", "S", "S", "S", "S"],
    },
    {
      player: "A,7",
      actions: ["S", "D", "D", "D", "D", "S", "S", "H", "H", "H"],
    },
    {
      player: "A,6",
      actions: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
    },
    {
      player: "A,4-5",
      actions: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
    },
    {
      player: "A,2-3",
      actions: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
    },
  ];

  const pairSplits = [
    {
      player: "A,A",
      actions: ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP"],
    },
    {
      player: "10,10",
      actions: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
    },
    {
      player: "9,9",
      actions: ["SP", "SP", "SP", "SP", "SP", "S", "SP", "SP", "S", "S"],
    },
    {
      player: "8,8",
      actions: ["SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP", "SP"],
    },
    {
      player: "7,7",
      actions: ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"],
    },
    {
      player: "6,6",
      actions: settings.doubleAfterSplit
        ? ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"]
        : ["SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H", "H"],
    },
    {
      player: "5,5",
      actions: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
    },
    {
      player: "4,4",
      actions: ["H", "H", "H", "SP", "SP", "H", "H", "H", "H", "H"],
    },
    {
      player: "2,2-3,3",
      actions: settings.doubleAfterSplit
        ? ["SP", "SP", "SP", "SP", "SP", "SP", "H", "H", "H", "H"]
        : ["H", "H", "SP", "SP", "SP", "SP", "H", "H", "H", "H"],
    },
  ];

  const dealerHeaders = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 9998,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "1100px",
          maxHeight: "90vh",
          backgroundColor: "#1a1a1a",
          borderRadius: "16px",
          padding: "24px",
          zIndex: 9999,
          overflowY: "auto",
          border: "2px solid #FFD700",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
            borderBottom: "2px solid #333",
            paddingBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#FFD700",
                margin: 0,
              }}
            >
              Basic Strategy Chart
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#AAA",
                border: "none",
                fontSize: "28px",
                cursor: "pointer",
                padding: "0 8px",
              }}
            >
              &times;
            </button>
          </div>
          <div style={{ fontSize: "13px", color: "#AAA", marginTop: "8px" }}>
            {settings.numberOfDecks} deck{settings.numberOfDecks > 1 ? "s" : ""}{" "}
            - Dealer {settings.dealerHitsSoft17 ? "hits" : "stands on"} soft 17
            - {settings.doubleAfterSplit ? "DAS allowed" : "No DAS"}
            {settings.lateSurrenderAllowed && " - Surrender allowed"}
          </div>
        </div>

        <div
          style={{
            marginBottom: "20px",
            padding: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("H"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Hit</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("S"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Stand</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("D"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Double</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: getActionColor("SP"),
                  borderRadius: "4px",
                }}
              />
              <span style={{ color: "#FFF" }}>Split</span>
            </div>
            {settings.lateSurrenderAllowed && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: getActionColor("SU"),
                    borderRadius: "4px",
                  }}
                />
                <span style={{ color: "#FFF" }}>Surrender</span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "10px",
              }}
            >
              Hard Totals
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#AAA",
                  // eslint-disable-next-line sonarjs/no-duplicate-string
                        border: "1px solid #444",
                      }}
                    >
                      Player
                    </th>
                    {dealerHeaders.map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFD700",
                          border: "1px solid #444",
                          fontSize: "11px",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hardTotals.map((row, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFF",
                          fontWeight: "bold",
                          border: "1px solid #444",
                          textAlign: "center",
                        }}
                      >
                        {row.player}
                      </td>
                      {row.actions.map((action, actionIdx) => (
                        <td
                          key={actionIdx}
                          style={{
                            padding: "6px",
                            backgroundColor: getActionColor(
                              action as StrategyAction,
                            ),
                            color: "#FFFFFF",
                            fontWeight: "bold",
                            border: "1px solid #444",
                            textAlign: "center",
                          }}
                        >
                          {action}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "10px",
              }}
            >
              Soft Totals
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#AAA",
                        border: "1px solid #444",
                      }}
                    >
                      Player
                    </th>
                    {dealerHeaders.map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFD700",
                          border: "1px solid #444",
                          fontSize: "11px",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {softTotals.map((row, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: "6px",
                          backgroundColor: "#2a2a2a",
                          color: "#FFF",
                          fontWeight: "bold",
                          border: "1px solid #444",
                          textAlign: "center",
                        }}
                      >
                        {row.player}
                      </td>
                      {row.actions.map((action, actionIdx) => (
                        <td
                          key={actionIdx}
                          style={{
                            padding: "6px",
                            backgroundColor: getActionColor(
                              action as StrategyAction,
                            ),
                            color: "#FFFFFF",
                            fontWeight: "bold",
                            border: "1px solid #444",
                            textAlign: "center",
                          }}
                        >
                          {action}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#FFF",
              marginBottom: "10px",
            }}
          >
            Pair Splitting
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "6px",
                      backgroundColor: "#2a2a2a",
                      color: "#AAA",
                      border: "1px solid #444",
                    }}
                  >
                    Pair
                  </th>
                  {dealerHeaders.map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#FFD700",
                        border: "1px solid #444",
                        fontSize: "11px",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pairSplits.map((row, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        padding: "6px",
                        backgroundColor: "#2a2a2a",
                        color: "#FFF",
                        fontWeight: "bold",
                        border: "1px solid #444",
                        textAlign: "center",
                      }}
                    >
                      {row.player}
                    </td>
                    {row.actions.map((action, actionIdx) => (
                      <td
                        key={actionIdx}
                        style={{
                          padding: "6px",
                          backgroundColor: getActionColor(
                            action as StrategyAction,
                          ),
                          color: "#FFFFFF",
                          fontWeight: "bold",
                          border: "1px solid #444",
                          textAlign: "center",
                        }}
                      >
                        {action}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: "#FFD700",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

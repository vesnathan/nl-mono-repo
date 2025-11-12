"use client";

import { useState } from "react";
import {
  TestScenario,
  TEST_SCENARIOS,
  getScenarioCategories,
  getScenariosByCategory,
} from "@/types/testScenarios";

interface TestScenarioSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: TestScenario | null) => void;
}

const CATEGORY_LABELS: Record<TestScenario["category"], string> = {
  basic: "🎯 Basic Strategy",
  split: "✂️ Splitting",
  double: "2️⃣ Double Down",
  surrender: "🏳️ Surrender",
  insurance: "🛡️ Insurance",
  "soft-hands": "🎴 Soft Hands",
};

const HOVER_BG_COLOR = "rgba(255, 152, 0, 0.2)";
const HOVER_BORDER_COLOR = "#FF9800";

export default function TestScenarioSelector({
  isOpen,
  onClose,
  onSelectScenario,
}: TestScenarioSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    TestScenario["category"] | "all"
  >("all");

  if (!isOpen) return null;

  const categories = getScenarioCategories();
  const displayedScenarios =
    selectedCategory === "all"
      ? TEST_SCENARIOS
      : getScenariosByCategory(selectedCategory);

  const handleSelectScenario = (scenario: TestScenario) => {
    onSelectScenario(scenario);
    onClose();
  };

  const handleRandomHand = () => {
    onSelectScenario(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          zIndex: 10000,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10001,
          maxHeight: "90vh",
          overflowY: "auto",
          width: "90%",
          maxWidth: "800px",
        }}
      >
        <div
          style={{
            backgroundColor: "#0F1419",
            border: "3px solid #FF9800",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.9)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#FFF" }}>
              🧪 Select Test Scenario
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#FFF",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "#FFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Random Hand Button */}
          <button
            type="button"
            onClick={handleRandomHand}
            style={{
              width: "100%",
              backgroundColor: "#4CAF50",
              color: "#FFF",
              border: "none",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: "24px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#45a049";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4CAF50";
            }}
          >
            🎲 Random Hand (Normal Play)
          </button>

          {/* Category Filter */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "14px",
                color: "#AAA",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Filter by Category
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                style={{
                  backgroundColor:
                    selectedCategory === "all"
                      ? "#FF9800"
                      : "rgba(255, 255, 255, 0.1)",
                  color: "#FFF",
                  border: "2px solid",
                  borderColor:
                    selectedCategory === "all"
                      ? "#FF9800"
                      : "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: selectedCategory === "all" ? "bold" : "normal",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                All Scenarios
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    backgroundColor:
                      selectedCategory === category
                        ? "#FF9800"
                        : "rgba(255, 255, 255, 0.1)",
                    color: "#FFF",
                    border: "2px solid",
                    borderColor:
                      selectedCategory === category
                        ? "#FF9800"
                        : "rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight:
                      selectedCategory === category ? "bold" : "normal",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxHeight: "400px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {displayedScenarios.map((scenario) => (
              <button
                type="button"
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#FFF",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 152, 0, 0.2)";
                  e.currentTarget.style.borderColor = "#FF9800";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.1)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {scenario.name}
                  </div>
                  {scenario.expectedAction && (
                    <div
                      style={{
                        backgroundColor: "rgba(74, 144, 226, 0.3)",
                        color: "#4A90E2",
                        border: "1px solid #4A90E2",
                        borderRadius: "6px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {scenario.expectedAction === "H" && "HIT"}
                      {scenario.expectedAction === "S" && "STAND"}
                      {scenario.expectedAction === "D" && "DOUBLE"}
                      {scenario.expectedAction === "SP" && "SPLIT"}
                      {scenario.expectedAction === "SU" && "SURRENDER"}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#AAA",
                    marginBottom: "8px",
                  }}
                >
                  {scenario.description}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}
                  >
                    {CATEGORY_LABELS[scenario.category]}
                  </span>
                  <span
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}
                  >
                    Dealer: {scenario.dealerUpCard.rank}
                    {scenario.dealerUpCard.suit === "H" && "♥"}
                    {scenario.dealerUpCard.suit === "D" && "♦"}
                    {scenario.dealerUpCard.suit === "C" && "♣"}
                    {scenario.dealerUpCard.suit === "S" && "♠"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

import React, { createContext, useContext, ReactNode } from "react";
import { HeatMapBucket } from "@/hooks/useHeatMap";

interface UIState {
  // Modal state
  initialized: boolean;
  showSettings: boolean;
  showLeaderboard: boolean;
  showStrategyCard: boolean;
  showHeatMap: boolean;
  showCountPeek: boolean;
  debugLogs: string[];
  showDebugLog: boolean;
  strategyCardUsedThisHand: boolean;

  // Dev/Testing mode
  devTestingMode: boolean;

  // Heat map
  heatMapBuckets: HeatMapBucket[];
  discretionScore: number;
  heatMapDataPointCount: number;

  // Setters
  setShowSettings: (show: boolean) => void;
  setShowAdminSettings: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowStrategyCard: (show: boolean) => void;
  setShowHeatMap: (show: boolean) => void;
  setShowDealerInfo: (show: boolean) => void;
  setShowCountPeek: (show: boolean) => void;
  setShowDebugLog: (show: boolean) => void;
  setDevTestingMode: (enabled: boolean) => void;
  clearDebugLogs: () => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);

export function UIStateProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: UIState;
}) {
  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error("useUIState must be used within a UIStateProvider");
  }
  return context;
}

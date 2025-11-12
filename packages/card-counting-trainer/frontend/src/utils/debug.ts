/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/**
 * Debug configuration for console logging
 * Toggle these flags to control what gets logged to the console
 */
export const DEBUG = {
  dealCards: false, // Card dealing logs
  dealerSpeech: true, // Dealer audio and speech
  playerActions: false, // Player hit/stand/double/split
  playerSpeech: false, // Player audio and speech
  aiTurns: false, // AI player decision making
  betting: false, // Betting phase logs
  gamePhases: false, // Phase transitions
  suspicion: false, // Suspicion and heat tracking
  conversations: false, // Player conversations
  insurance: false, // Insurance phase
  audioQueue: true, // Audio queue processing
  speechBubbles: true, // Speech bubble creation
  testScenario: true, // Test scenario forced card dealing
};

/**
 * Wrapper for console.log that respects debug flags
 * Usage: debugLog('dealCards', 'Dealing card:', card);
 */
export const debugLog = (category: keyof typeof DEBUG, ...args: any[]) => {
  if (DEBUG[category]) {
    console.log(...args);
  }
};

/**
 * Always log (for errors and critical messages)
 */
export const errorLog = (...args: any[]) => {
  console.error(...args);
};

/**
 * Always log warnings
 */
export const warnLog = (...args: any[]) => {
  console.warn(...args);
};

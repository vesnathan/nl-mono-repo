export const FRANK_VOICE = {
  engine: "elevenlabs",
  speed: 0.98,
  settings: { stability: 0.6, similarity: 0.8, style: 0.05, speakerBoost: true },
  lines: {
    place_bets: [
      "Place your bets.",
      "Bets open…"
    ],
    no_more_bets: [
      "No more bets.",
      "Bets are closed."
    ],
    dealer_has_17: ["Dealer has seventeen."],
    dealer_has_18: ["Dealer has eighteen."],
    dealer_has_19: ["Dealer has nineteen."],
    dealer_has_20: ["Dealer has twenty."],
    dealer_has_21: ["Dealer has twenty-one."],
    dealer_busts: [
      "Dealer busts.",
      "Bust."
    ],
    blackjack: [
      "Blackjack.",
      "Blackjack…"
    ],
    insurance: [
      "Insurance?",
      "Insurance is… available."
    ],
    greet_welcome: [
      "Welcome.",
      "Hey there."
    ],
    greet_good_luck: [
      "Good luck.",
      "Good… luck."
    ],
    farewell_thanks: [
      "Thank you for playing.",
      "Thanks."
    ],
    session_complete: [
      "Session complete.",
      "That’s the shoe."
    ],
    react_nice_hand: [
      "Nice hand.",
      "That’s nice."
    ],
    react_tough_break: [
      "Tough break.",
      "Hm. Unlucky."
    ],
    react_well_played: [
      "Well played.",
      "Good move."
    ],
    react_better_luck: [
      "Maybe next time.",
      "Next hand."
    ],
    react_house_wins: [
      "House wins.",
      "House takes it."
    ],
  }
};

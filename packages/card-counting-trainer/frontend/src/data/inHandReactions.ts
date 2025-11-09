import { AICharacter } from "./aiCharacters";

/**
 * Get character reaction when dealt initial hand
 */
export function getInitialHandReaction(
  character: AICharacter,
  handValue: number,
  hasBlackjack: boolean,
): string | null {
  // Only react to notably good or bad hands
  if (hasBlackjack) {
    const reactions = [
      "BLACKJACK! Right off the bat!",
      "Twenty-one baby! Let's GO!",
      "Blackjack! This is my hand!",
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  if (handValue === 20) {
    const reactions = [
      "Twenty! Looking good!",
      "Oh yeah, twenty right here!",
      "Nice! Got a twenty!",
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  if (handValue <= 12) {
    // Bad starting hands
    const reactions = [
      "Ugh, seriously?",
      "Well this is rough...",
      "Not a great start...",
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Most hands (13-19) get no initial reaction
  return null;
}

/**
 * Get character reaction when hitting and receiving a card
 */
export function getHitReaction(
  character: AICharacter,
  newCard: string,
  oldHandValue: number,
  newHandValue: number,
): string | null {
  // Busted
  if (newHandValue > 21) {
    const reactions = [
      "BUST! Dammit!",
      "No! I busted!",
      "Fuck! Too much!",
      "Shit! Over 21!",
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Perfect hit (got exactly what was needed)
  if (newHandValue === 21) {
    const reactions = [
      "TWENTY-ONE! Perfect!",
      "Yes! Twenty-one!",
      "That's it! Twenty-one!",
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Good card (got to 19-20)
  if (newHandValue >= 19 && oldHandValue < 17) {
    const reactions = [
      `Nice! ${newHandValue}!`,
      `Good card! ${newHandValue}!`,
      `Perfect! ${newHandValue}!`,
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }

  // Bad card but didn't bust (still stuck in danger zone)
  if (newHandValue >= 12 && newHandValue <= 16 && oldHandValue >= 12) {
    const reactions = [
      "Come on, not helping...",
      "Still stuck...",
      "Ugh, another bad one...",
    ];
    // Only 30% chance to complain about mediocre cards
    if (Math.random() < 0.3) {
      return reactions[Math.floor(Math.random() * reactions.length)];
    }
  }

  return null;
}

/**
 * Get character-specific personality reactions
 */
export function getPersonalityReaction(
  character: AICharacter,
  situation: "bust" | "hit21" | "goodHit" | "badStart",
): string {
  switch (character.personality) {
    case "drunk":
      if (situation === "bust") return "*hiccup* BUSTED! Fuck!";
      if (situation === "hit21") return "TWENTY-ONE BABY! *slams table*";
      if (situation === "goodHit") return "Haha! Not bad!";
      return "Ah shit... *squints at cards*";

    case "clumsy":
      if (situation === "bust") return "Oh no! I busted! *drops cards*";
      if (situation === "hit21") return "Twenty-one?! Really?! *knocks drink*";
      if (situation === "goodHit") return "Oh! That's good right?";
      return "Oh dear... this isn't good...";

    case "chatty":
      if (situation === "bust")
        return "BUSTED! Just like that deal I lost last month!";
      if (situation === "hit21") return "TWENTY-ONE! That's how you DO IT!";
      if (situation === "goodHit")
        return "Nice! Reminds me of this one time...";
      return "Not great, but you know what I always say...";

    case "superstitious":
      if (situation === "bust") return "BUST! The energy was OFF! I knew it!";
      if (situation === "hit21") return "TWENTY-ONE! The universe provides!";
      if (situation === "goodHit") return "My crystals were RIGHT!";
      return "Bad energy... I should've cleansed first...";

    case "cocky":
      if (situation === "bust") return "BUST?! How the FUCK?!";
      if (situation === "hit21") return "TWENTY-ONE! Too easy!";
      if (situation === "goodHit") return "Of course. I called it.";
      return "Whatever, I've had worse hands...";

    case "nervous":
      if (situation === "bust") return "BUSTED! Oh god, is that bad?!";
      if (situation === "hit21")
        return "Twenty-one! *nervous sweat* Did I win?!";
      if (situation === "goodHit")
        return "Oh! Is that good? That's good right?!";
      return "*sweating* This feels illegal...";

    case "lucky":
      if (situation === "bust") return "BUST?! My streak is OVER?!";
      if (situation === "hit21") return "TWENTY-ONE! I FELT it coming!";
      if (situation === "goodHit") return "Called it! Lucky Larry strikes!";
      return "Hmm, my gut says this'll work out...";

    case "unlucky":
      if (situation === "bust") return "BUST! Of COURSE! *laughs*";
      if (situation === "hit21")
        return "Twenty-one?! Did that actually happen?!";
      if (situation === "goodHit") return "Wait, I got a GOOD card?!";
      return "And here we go... classic me...";

    default:
      return getInitialHandReaction(character, 12, false) || "";
  }
}

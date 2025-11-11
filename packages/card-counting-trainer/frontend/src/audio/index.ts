export type DealerVoicePack = {
  engine: "elevenlabs";
  speed: number;
  settings: {
    stability: number;
    similarity: number;
    style: number;
    speakerBoost: boolean;
  };
  lines: Record<DealerCallKey, string[]>;
};

export const DEALER_AUDIO_SCRIPTS: Record<string, DealerVoicePack> = {
  "maria-counter": MARIA_VOICE,
  "rookie-jenny": JENNY_VOICE,
  "strict-harold": HAROLD_VOICE,
  "friendly-marcus": MARCUS_VOICE,
  "oblivious-frank": FRANK_VOICE,
  "veteran-lisa": LISA_VOICE,
};

export function dealerAudioPath(
  dealerId: string,
  key: DealerCallKey,
  variant = 1,
) {
  const v = String(variant).padStart(2, "0");
  return `audio/dealers/${dealerId}/${key}_${v}.mp3`;
}

// rotate variants easily
export function pickDealerLine(
  dealerId: string,
  key: DealerCallKey,
  variantIndex = 0,
) {
  const pack = DEALER_AUDIO_SCRIPTS[dealerId];
  const opts = pack?.lines[key] ?? [];
  return opts[(variantIndex + opts.length) % opts.length] || "";
}

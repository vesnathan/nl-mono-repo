import { util, Context } from "@aws-appsync/utils";
import { AudioSettings } from "gqlTypes";

type CTX = Context<object, object, object, object, AudioSettings>;

export function request(ctx: CTX) {
  console.log("Getting global audio settings");

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: "ADMIN",
      SK: "SETTINGS#AUDIO",
    }),
  };
}

export function response(ctx: CTX): AudioSettings {
  if (ctx.error) {
    console.error("Error fetching global audio settings:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result as any;
  const now = util.time.nowISO8601();

  // If no settings exist, return defaults
  if (!item) {
    return {
      __typename: "AudioSettings",
      musicVolume: 30,
      playerSpeechVolume: 80,
      dealerSpeechVolume: 80,
      masterVolume: 100,
      updatedAt: now,
      updatedBy: "system",
    };
  }

  const settings: AudioSettings = {
    __typename: "AudioSettings",
    musicVolume: item.musicVolume || 30,
    playerSpeechVolume: item.playerSpeechVolume || 80,
    dealerSpeechVolume: item.dealerSpeechVolume || 80,
    masterVolume: item.masterVolume || 100,
    updatedAt: item.updatedAt || now,
    updatedBy: item.updatedBy || "system",
  };

  console.log("Global audio settings fetched successfully");
  return settings;
}

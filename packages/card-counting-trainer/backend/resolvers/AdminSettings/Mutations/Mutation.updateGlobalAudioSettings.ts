import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { AudioSettingsInput, AudioSettings } from "gqlTypes";

type CTX = Context<
  { input: AudioSettingsInput },
  object,
  object,
  object,
  AudioSettings
>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;
  const username = identity.username || userId;

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException",
    );
  }

  // Check if user is in Admins group
  const groups = identity.groups || [];
  if (!groups.includes("Admins")) {
    return util.error(
      "Forbidden: You must be an admin to update global settings",
      "ForbiddenException",
    );
  }

  const input = ctx.args.input;
  const now = util.time.nowISO8601();

  console.log(
    `Admin ${username} updating global audio settings:`,
    JSON.stringify(input),
  );

  // Validate volume ranges (0-100)
  if (input.musicVolume < 0 || input.musicVolume > 100) {
    return util.error(
      "musicVolume must be between 0 and 100",
      "ValidationException",
    );
  }
  if (input.playerSpeechVolume < 0 || input.playerSpeechVolume > 100) {
    return util.error(
      "playerSpeechVolume must be between 0 and 100",
      "ValidationException",
    );
  }
  if (input.dealerSpeechVolume < 0 || input.dealerSpeechVolume > 100) {
    return util.error(
      "dealerSpeechVolume must be between 0 and 100",
      "ValidationException",
    );
  }
  if (input.masterVolume < 0 || input.masterVolume > 100) {
    return util.error(
      "masterVolume must be between 0 and 100",
      "ValidationException",
    );
  }

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: "ADMIN",
      SK: "SETTINGS#AUDIO",
    }),
    attributeValues: util.dynamodb.toMapValues({
      PK: "ADMIN",
      SK: "SETTINGS#AUDIO",
      musicVolume: input.musicVolume,
      playerSpeechVolume: input.playerSpeechVolume,
      dealerSpeechVolume: input.dealerSpeechVolume,
      masterVolume: input.masterVolume,
      updatedAt: now,
      updatedBy: username,
    }),
  };
}

export function response(ctx: CTX): AudioSettings {
  if (ctx.error) {
    console.error("Error updating global audio settings:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result as any;

  const settings: AudioSettings = {
    __typename: "AudioSettings",
    musicVolume: item.musicVolume,
    playerSpeechVolume: item.playerSpeechVolume,
    dealerSpeechVolume: item.dealerSpeechVolume,
    masterVolume: item.masterVolume,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy,
  };

  console.log("Global audio settings updated successfully by admin");
  return settings;
}

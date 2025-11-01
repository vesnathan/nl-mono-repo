import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Story, CreateStoryInput } from "gqlTypes";
import {
  AGE_RATINGS,
  isValidAgeRating,
} from "../../../constants/ContentRatings";
import { STORY_GENRES, isValidGenre } from "../../../constants/Genres";
import {
  CONTENT_WARNINGS,
  isValidContentWarning,
} from "../../../constants/ContentWarnings";

type CTX = Context<{ input: CreateStoryInput }, object, object, object, Story>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // Generate unique ID
  const storyId = util.autoId();
  const now = util.time.nowISO8601();

  console.log(`Creating story for user: ${identity.username}`);

  // Validate ageRating using constants
  if (!isValidAgeRating(input.ageRating)) {
    return util.error(
      `Invalid age rating: ${input.ageRating}. Valid options: ${AGE_RATINGS.map((r) => r.id).join(", ")}`,
      "ValidationException",
    );
  }

  // Validate genres
  for (const genre of input.genre) {
    if (!isValidGenre(genre)) {
      return util.error(
        `Invalid genre: ${genre}. Valid options: ${STORY_GENRES.join(", ")}`,
        "ValidationException",
      );
    }
  }

  // Validate content warnings
  for (const warning of input.contentWarnings) {
    if (!isValidContentWarning(warning)) {
      return util.error(
        `Invalid content warning: ${warning}. Valid options: ${CONTENT_WARNINGS.join(", ")}`,
        "ValidationException",
      );
    }
  }

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: "METADATA",
    }),
    attributeValues: util.dynamodb.toMapValues({
      storyId,
      authorId: identity.username,
      authorName: identity.username, // Use username as display name for now
      title: input.title,
      synopsis: input.synopsis,
      genre: input.genre,
      ageRating: input.ageRating,
      contentWarnings: input.contentWarnings,
      ratingExplanation: input.ratingExplanation,
      coverImageUrl: input.coverImageUrl,
      rootNodeId: null, // Will be set when first chapter is created
      aiCreated: input.aiCreated !== undefined ? input.aiCreated : false,
      allowAI: input.allowAI !== undefined ? input.allowAI : true,
      stats: {
        totalBranches: 0,
        totalReads: 0,
        rating: null,
      },
      featured: false,
      createdAt: now,
      // For browse/discover queries
      GSI1PK: "STORY",
      GSI1SK: `STORY#${storyId}`,
    }),
  };
}

export function response(ctx: CTX): Story {
  if (ctx.error) {
    console.error("Error creating story:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Story created successfully:", ctx.result);
  return ctx.result as Story;
}

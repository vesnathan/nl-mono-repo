import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Story, UpdateStoryInput } from "gqlTypes";
import { isValidAgeRating } from "../../../constants/ContentRatings";
import { isValidGenre } from "../../../constants/Genres";
import { isValidContentWarning } from "../../../constants/ContentWarnings";

type CTX = Context<{ input: UpdateStoryInput }, object, object, object, Story>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  console.log(`Updating story ${input.storyId} for user: ${identity.username}`);

  const updateExpression: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, any> = {};

  if (input.title) {
    updateExpression.push("#title = :title");
    expressionNames["#title"] = "title";
    expressionValues[":title"] = input.title;
  }

  if (input.synopsis) {
    updateExpression.push("#synopsis = :synopsis");
    expressionNames["#synopsis"] = "synopsis";
    expressionValues[":synopsis"] = input.synopsis;
  }

  if (input.genre) {
    // Validate genres
    for (const genre of input.genre) {
      if (!isValidGenre(genre)) {
        return util.error(`Invalid genre: ${genre}`, "ValidationException");
      }
    }
    updateExpression.push("#genre = :genre");
    expressionNames["#genre"] = "genre";
    expressionValues[":genre"] = input.genre;
  }

  if (input.ageRating) {
    if (!isValidAgeRating(input.ageRating)) {
      return util.error(
        `Invalid age rating: ${input.ageRating}`,
        "ValidationException",
      );
    }
    // TODO: Add logic to ensure ageRating can only increase
    updateExpression.push("#ageRating = :ageRating");
    expressionNames["#ageRating"] = "ageRating";
    expressionValues[":ageRating"] = input.ageRating;
  }

  if (input.contentWarnings) {
    // Validate content warnings
    for (const warning of input.contentWarnings) {
      if (!isValidContentWarning(warning)) {
        return util.error(
          `Invalid content warning: ${warning}`,
          "ValidationException",
        );
      }
    }
    updateExpression.push("#contentWarnings = :contentWarnings");
    expressionNames["#contentWarnings"] = "contentWarnings";
    expressionValues[":contentWarnings"] = input.contentWarnings;
  }

  if (input.coverImageUrl !== undefined) {
    updateExpression.push("#coverImageUrl = :coverImageUrl");
    expressionNames["#coverImageUrl"] = "coverImageUrl";
    expressionValues[":coverImageUrl"] = input.coverImageUrl;
  }

  if (input.featured !== undefined) {
    updateExpression.push("#featured = :featured");
    expressionNames["#featured"] = "featured";
    expressionValues[":featured"] = input.featured;
  }

  if (input.allowAI !== undefined) {
    updateExpression.push("#allowAI = :allowAI");
    expressionNames["#allowAI"] = "allowAI";
    expressionValues[":allowAI"] = input.allowAI;
  }

  if (updateExpression.length === 0) {
    return util.error("No fields to update", "ValidationException");
  }

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${input.storyId}`,
      SK: "METADATA",
    }),
    update: {
      expression: `SET ${updateExpression.join(", ")}`,
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
    // Only update if author matches
    condition: {
      expression: "authorId = :authorId",
      expressionValues: util.dynamodb.toMapValues({
        ":authorId": identity.username,
      }),
    },
  };
}

export function response(ctx: CTX): Story {
  if (ctx.error) {
    if (ctx.error.type === "ConditionalCheckFailedException") {
      return util.error(
        "Unauthorized: Only the story author can update",
        "Unauthorized",
      );
    }
    console.error("Error updating story:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Story updated successfully:", ctx.result);
  return ctx.result as Story;
}

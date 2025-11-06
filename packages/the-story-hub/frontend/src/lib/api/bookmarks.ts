import { client } from "@/lib/amplify";
import { saveBookmark } from "@/graphql/mutations";
import { getBookmark } from "@/graphql/queries";
import { BookmarkSchema, type Bookmark } from "@/types/BookmarkSchemas";
import type { SaveBookmarkInput } from "@/types/gqlTypes";

export async function saveBookmarkAPI(
  input: SaveBookmarkInput,
): Promise<Bookmark> {
  const result = await client.graphql({
    query: saveBookmark,
    variables: { input },
  });
  return BookmarkSchema.parse(result.data.saveBookmark);
}

export async function getBookmarkAPI(
  storyId: string,
): Promise<Bookmark | null> {
  const result = await client.graphql({
    query: getBookmark,
    variables: { storyId },
  });
  const { data } = result as { data: { getBookmark: unknown } };
  if (!data.getBookmark) return null;
  return BookmarkSchema.parse(data.getBookmark);
}

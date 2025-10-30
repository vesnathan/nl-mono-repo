import { client } from '@/lib/amplify';
import { saveBookmark } from '@/graphql/mutations';
import { getBookmark } from '@/graphql/queries';
import type {
  Bookmark,
  SaveBookmarkInput,
} from '@/types/gqlTypes';

export async function saveBookmarkAPI(input: SaveBookmarkInput): Promise<Bookmark> {
  const result = await client.graphql({
    query: saveBookmark,
    variables: { input },
  });
  return result.data.saveBookmark;
}

export async function getBookmarkAPI(storyId: string): Promise<Bookmark | null> {
  const result = await client.graphql({
    query: getBookmark,
    variables: { storyId },
  });
  return result.data.getBookmark ?? null;
}

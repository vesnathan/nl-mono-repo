import { userQueryKeys } from "@/graphql/queries/userQueries";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { generateS3SignedURLMutationFn } from "@/graphql/queries/fileUploadQueries";
import UserPlaceholder from "../assets/images/user-placeholder.png";

const DEFAULT_IMAGE_URL = UserPlaceholder;

export const useUserProfilePictureUrl = (): string => {
  const { userProfilePicture } = useUserStore((userStore) => userStore.user);

  // eventhough it's a graphql mutation
  // we wrap it inside useQuery to make use of its caching feature
  const profilePictureQuery = useQuery({
    queryKey: [
      userQueryKeys.profilePicture,
      userProfilePicture?.Bucket,
      userProfilePicture?.Key,
    ],
    queryFn: async (): Promise<string> => {
      if (!userProfilePicture) {
        return DEFAULT_IMAGE_URL;
      }
      const { data } = await generateS3SignedURLMutationFn({
        bucketName: userProfilePicture.Bucket,
        fileKey: userProfilePicture.Key,
      });
      return data.generateS3SignedURL;
    },
  });

  return profilePictureQuery.data ?? DEFAULT_IMAGE_URL;
};

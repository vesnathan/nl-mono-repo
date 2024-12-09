import { useGraphqlMutation } from "@/hooks/useGraphQlMutation";
import { CWLClient } from "shared/types/CWLClient";

export const useSaveClientMutation = (input: { onSuccess: () => void }) => {
  return useGraphqlMutation({
    invalidateKeys: [],
    getSuccessMessage: () => {
      return "Client data edited";
    },
    onSuccess: () => {
      input.onSuccess();
    },
    mutationFn: async (_clientData: CWLClient) => {
      const clientData: CWLClient = { ..._clientData };


      await saveToDbMutation.mutateAsync({
        fieldUpdates,
        dataSet: "assets",
        dataSource: "UserEdit",
      });
    },
  });

};

import { removeSlsBackend } from "shared/scripts/removeSlsBackend";

const removeShared = async () => {
  await removeSlsBackend();
};

removeShared().catch((error) => {
  console.error("Failed to remove shared stack:", error);
});
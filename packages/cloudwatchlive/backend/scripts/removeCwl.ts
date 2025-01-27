import { removeSlsBackend } from "shared/scripts/removeSlsBackend";

const removeCwl = async () => {
  await removeSlsBackend();
};

removeCwl().catch((error) => {
  console.error("Failed to remove CWL stack:", error);
});
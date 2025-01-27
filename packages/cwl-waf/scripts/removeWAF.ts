import { removeSlsBackend } from "shared/scripts/removeSlsBackend";

const removeWaf = async () => {
  await removeSlsBackend();
};

removeWaf().catch((error) => {
  console.error("Failed to remove WAF stack:", error);
});
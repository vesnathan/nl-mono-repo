import { deploySlsBackend } from "shared/scripts/deploySlsBackend";

const start = async () => {
  await deploySlsBackend({
    hasFrontendDeployment: false,
  });
};

start();

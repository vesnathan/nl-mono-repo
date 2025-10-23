const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;
export default environment;

export const IS_PRODUCTION = environment === "prod";
export const IS_STAGING = environment === "staging";

export const IS_DEV = environment?.includes("dev");

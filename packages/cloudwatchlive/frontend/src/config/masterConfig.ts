const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;
// Only log in development mode
if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.log(environment, "environment");
}
export default environment;

export const IS_PRODUCTION = environment === "prod";
export const IS_STAGING = environment === "staging";

export const IS_DEV = environment?.includes("dev");

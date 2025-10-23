// Minimal dev-mocks for AwsExample frontend (modeled after CWL dev-mocks)
import users from "./mockUsers.json";

export type AwseUser = typeof users extends Array<infer U> ? U : any;

export const MOCK_USERS: AwseUser[] = users as unknown as AwseUser[];

export default {
  MOCK_USERS,
};

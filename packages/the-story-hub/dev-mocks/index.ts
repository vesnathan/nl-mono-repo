// Minimal dev-mocks for TheStoryHub frontend (modeled after CWL dev-mocks)
import users from "./mockUsers.json";

export type TshUser = typeof users extends Array<infer U> ? U : any;

export const MOCK_USERS: TshUser[] = users as unknown as TshUser[];

export default {
  MOCK_USERS,
};

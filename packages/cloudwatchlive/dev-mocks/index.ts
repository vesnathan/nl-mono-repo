// Expose canonical dev-mocks as a tiny workspace package
import users from "./mockUsers.json";
import events from "./mockEvents.json";
import orgs from "./mockOrgs.json";

export type CwlUser = typeof users extends Array<infer U> ? U : any;
export type CwlEvent = typeof events extends Array<infer E> ? E : any;
export type CwlOrg = typeof orgs extends Array<infer O> ? O : any;

export const MOCK_USERS: CwlUser[] = users as unknown as CwlUser[];
export const MOCK_EVENTS: CwlEvent[] = events as unknown as CwlEvent[];
export const MOCK_ORGS: CwlOrg[] = orgs as unknown as CwlOrg[];

export default {
  MOCK_USERS,
  MOCK_EVENTS,
  MOCK_ORGS,
};

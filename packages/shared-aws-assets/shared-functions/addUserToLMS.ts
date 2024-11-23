import axios from "axios";
import { generatePassword } from "./generatePassword";

/**
 * Add user to Moodle.
 * @returns new Moodle User Id.
 * If user already exists on Moodle (same email address), returns existing Moodle user Id
 */
export const addUserToLMS = async (input: {
  userEmail: string;
  firstName: string;
  lastName: string;
  LMSBaseURL: string;
  LMSToken: string;
}): Promise<string> => {
  const { userEmail, firstName, lastName, LMSBaseURL, LMSToken } = input;
  const LMS_URL = `${LMSBaseURL}${LMSToken}`;
  const tempPassword = generatePassword(true, true, true, true, 8);

  console.log("Adding user to LMS", input.userEmail);
  const getLMSUserByEmail = async (): Promise<string | null> => {
    type GetUsersData = {
      id: number;
    }[];
    const getUsersResponse = await axios.get(LMS_URL, {
      params: {
        wsfunction: "core_user_get_users_by_field",
        field: "email",
        values: [userEmail],
      },
    });
    if (getUsersResponse.data.exception) {
      return null;
    }
    const getUsersData = getUsersResponse.data as GetUsersData;
    if (getUsersData[0]) {
      return `${getUsersData[0].id}`;
    }
    return null;
  };

  console.log("Checking if user already exists in LMS");
  const existingLMSUserId = await getLMSUserByEmail();
  console.log("Checking result", existingLMSUserId);
  if (existingLMSUserId) {
    return existingLMSUserId;
  }

  console.log("Creating LMS User");
  const createUserResponse = await axios.post(
    `${LMS_URL}&wsfunction=core_user_create_users&users[0][username]=${userEmail}&users[0][password]=${tempPassword}&users[0][firstname]=${firstName}&users[0][lastname]=${lastName}&users[0][email]=${userEmail}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  console.log("Create LMS User response", createUserResponse.data);

  if (createUserResponse.data.exception) {
    throw Error(createUserResponse.data.message);
  }
  type CreateUserData = {
    id: number;
    username: string;
  }[];
  const createUserData = createUserResponse.data as CreateUserData;
  const firstItem = createUserData[0];
  if (!firstItem) {
    throw Error(`Unable to add user to LMS 152.258`);
  }
  return `${firstItem.id}`;
};

const validationConfigs = [
  {
    message: "Be at least 8 characters long",
    regexp: /^(?!\s*$).{8,}$/,
  },
  {
    message: "Have a special character like ! @ $ % *",
    regexp: /^(?=.*[!@#$%^&*])/,
  },
  {
    message: "Have at least one number",
    regexp: /^(?=.*[0-9])/,
  },
  {
    message: "Have an uppercase letter",
    regexp: /^(?=.*[A-Z])/,
  },
  {
    message: "Have a lowercase letter",
    regexp: /^(?=.*[a-z])/,
  },
];

export type ValidatePWResult = {
  message: string;
  satisfied: boolean;
}[];
export const authValidatePassword = (password: string): ValidatePWResult => {
  return validationConfigs.map((validation) => ({
    message: validation.message,
    satisfied: validation.regexp.test(password),
  }));
};

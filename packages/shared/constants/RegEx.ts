const NOT_EMPTY = /^(?!\s*$).+/;
const ACCEPTED_STRING = /^[ A-Za-z0-9_@./!$%()_#&+-?'"/\r\n]*$/;
const PASSWORD_LENGTH = /^(?!\s*$).{8,}$/;
const PASSWORD_SPECIAL = /^(?=.*[!@#$%^&*])/;
const PASSWORD_NUMBER = /^(?=.*[0-9])/;
const PASSWORD_UPPER = /^(?=.*[A-Z])/;
const PASSWORD_LOWER = /^(?=.*[a-z])/;
const NUMBER = /^[0-9]*$/;
const IS_IMAGE = /\.(jpe?g|png)$/i;
const EMAIL = /^(?!\.)(?!.*\.\.)([A-Z0-9_\'.+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const ALPHA_NUMERIC = /^[a-zA-Z0-9\-]+$/;

export const REGEX = {
  ACCEPTED_STRING,
  ALPHA_NUMERIC, // Added for stage validation
  EMAIL,
  IS_IMAGE,
  NOT_EMPTY,
  NUMBER,
  PASSWORD_LENGTH,
  PASSWORD_LOWER,
  PASSWORD_NUMBER,
  PASSWORD_SPECIAL,
  PASSWORD_UPPER,
};

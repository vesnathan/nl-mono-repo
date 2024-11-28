const NOT_EMPTY = /^(?!\s*$).+/;
const EMAIL =
  // eslint-disable-next-line no-useless-escape, security/detect-unsafe-regex
  /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/;
const ACCEPTED_STRING = /^[ A-Za-z0-9_@./!$%()_#&+-?'"/\r\n]*$/;
const PASSWORD_LENGTH = /^(?!\s*$).{8,}$/;
const PASSWORD_SPECIAL = /^(?=.*[!@#$%^&*])/;
const PASSWORD_NUMBER = /^(?=.*[0-9])/;
const PASSWORD_UPPER = /^(?=.*[A-Z])/;
const PASSWORD_LOWER = /^(?=.*[a-z])/;
const NUMBER = /^[0-9]*$/;
const IS_IMAGE = /\.(jpe?g|png)$/i;

export const REGEX = {
  ACCEPTED_STRING,
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

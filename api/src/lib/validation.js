import { define } from "superstruct";
import isUuid from "is-uuid";
import isEmail from "is-email";

export const Email = define("Email", isEmail);
export const Uuid = define("Uuid", isUuid.v4);

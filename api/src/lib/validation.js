import { define } from "superstruct";
import isUuid from "is-uuid";
import isEmail from "is-email";
import * as ss from "superstruct";

export const Email = define("Email", isEmail);
export const Uuid = define("Uuid", isUuid.v4);

export const ActionBody = ss.object({
  name: ss.size(ss.string(), 1, 999),
  condition: ss.size(ss.string(), 1, 999),
  waitFor: ss.min(ss.number(), 0),
  type: ss.enums(["telegram", "email", "power_on"]),
});

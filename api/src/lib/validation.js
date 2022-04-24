import { define } from "superstruct";
import isUuid from "is-uuid";
import isEmail from "is-email";
import * as ss from "superstruct";

export const Email = define("Email", isEmail);
export const Uuid = define("Uuid", isUuid.v4);

const TelegramActionProps = ss.object({
  chatId: ss.size(ss.string(), 1, 999),
  message: ss.size(ss.string(), 1, 999),
});

const EmailActionProps = ss.object({
  to: ss.size(ss.string(), 1, 999),
  message: ss.size(ss.string(), 1, 999),
});

const propMap = {
  telegram: TelegramActionProps,
  email: EmailActionProps,
};

export const ActionBody = ss.object({
  name: ss.size(ss.string(), 1, 999),
  condition: ss.size(ss.string(), 1, 999),
  waitFor: ss.min(ss.number(), 0),
  type: ss.enums(["telegram", "email", "power_on"]),
  props: ss.dynamic((value, parent) => {
    return propMap[parent.branch[0].type] || ss.never();
  }),
});

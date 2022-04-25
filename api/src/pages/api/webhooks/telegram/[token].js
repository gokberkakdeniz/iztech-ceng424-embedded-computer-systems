import telegramChatIdDictionary from "../../../../lib/telegram";
import * as isUuid from "is-uuid";

export default async function telegramGetChatId(req, res) {
  if (req.method !== "GET") {
    return res.send({ error: true, message: "method not allowed." });
  }

  const token = req.query.token;

  if (!isUuid.v4(token)) {
    return res.send({ error: true, message: "id must be uuid v4." });
  }

  const chatId = telegramChatIdDictionary.get(token);

  res.send({ error: false, data: chatId });
}

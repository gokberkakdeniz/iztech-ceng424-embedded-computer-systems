import telegramChatIdDictionary from "../../../../lib/telegram";

export default async function telegramWebHookRoute(req, res) {
  const { body } = req;

  if (body?.message) {
    const { text, chat } = body.message;

    if (text.startsWith("/start token_")) {
      const token = text.substring(13);
      const id = chat.id;

      telegramChatIdDictionary.add(token, id);
    }
  }

  res.send({ error: false, message: "ok" });
}

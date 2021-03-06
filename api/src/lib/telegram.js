class TelegramChatIdDictionary {
  constructor() {
    this.dict = {};
  }

  add(token, chatId) {
    this.dict[token] = chatId;
  }

  get(token) {
    const result = this.dict[token];
    delete this.dict[token];
    return result;
  }
}

module.exports = new TelegramChatIdDictionary();

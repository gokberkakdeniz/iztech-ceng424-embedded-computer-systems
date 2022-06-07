const { compileExpression } = require("filtrex");
const db = require("./db.js");
const logger = require("./logger.js");
const MailProvider = require("./mailer.js");

console.log("CREATED_ACTION");

class Action {
  constructor() {}

  run() {
    throw new Error("Not implemented.");
  }
}

class TelegramAction extends Action {
  constructor(raw) {
    super();

    this.message = raw.message;
    this.chatId = raw.chat_id;
  }

  async run(data) {
    const message = this.message.replaceAll(
      /\{([a-zA-Z0-9_-]+)\}/g,
      (match, p1) => {
        return data[p1] ?? match;
      },
    );

    const result = await this.tg("sendmessage", {
      chat_id: this.chatId,
      text: message,
      // parse_mode: "MarkdownV2",
      parse_mode: "HTML",
    });

    return result;
  }

  async tg(type, data) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      ).then((res) => res.json());

      if (!response.ok)
        return {
          error: true,
          message: "telegram error.",
          data: response,
        };

      return {
        error: false,
        data: response,
      };
    } catch (e) {
      return {
        error: true,
        message: e.message,
      };
    }
  }
}

class EmailAction extends Action {
  constructor(raw) {
    super();

    this.receiverEmail = raw.to;
    this.subject = raw.subject;
    this.message = raw.message;
  }

  async run() {
    try {
      const response = await MailProvider.sendMail(
        this.receiverEmail,
        this.subject,
        this.message,
      );
      return {
        error: false,
        data: response,
      };
    } catch (err) {
      return {
        error: true,
        data: err,
      };
    }
  }
}

class PowerOnDeviceAction extends Action {
  constructor() {
    super();
  }

  run() {}
}

class WebHookAction extends Action {
  constructor() {
    super();
  }

  run() {}
}

const actionTypeClassMap = {
  telegram: TelegramAction,
  email: EmailAction,
  power_on: PowerOnDeviceAction,
};

class ActionModel {
  constructor(raw) {
    this.id = raw.id;
    this.name = raw.name;
    this.type = raw.type;
    this.deviceId = raw.device_id;
    this.triggeredAt = raw.triggered_at;
    this.condition = raw.condition;
    this.waitFor = Number.parseFloat(raw.wait_for);

    this.action = new actionTypeClassMap[this.type](raw.props);

    if (this.triggeredAt) this.setNextRun();
  }

  get condition() {
    return this._condition;
  }

  set condition(cond) {
    this._condition = cond;
    this.evaluateCondition = compileExpression(cond);
  }

  setNextRun() {
    this.nextRun = new Date(this.triggeredAt);
    this.nextRun.setSeconds(this.nextRun.getSeconds() + this.waitFor);
  }

  async trigger(values) {
    if (this.evaluateCondition(values)) {
      const now = new Date();

      if (!this.triggeredAt || this.nextRun <= now) {
        this.triggeredAt = now;
        this.setNextRun();

        const result = await this.action.run(values).catch((x) => x);

        const [, err] = await db.queryOne(
          "UPDATE actions SET triggered_at = $1 WHERE id = $2",
          [this.triggeredAt, this.id],
        );

        logger.error({
          name: "action_triggered",
          result: result,
          action: this.dump(),
          error: err,
        });
      }
    }
  }

  dump() {
    const result = Object.fromEntries(Object.entries(this));
    delete result.evaluateCondition;
    result.condition = result._condition;
    delete result._condition;
    return result;
  }
}

class ActionRunner {
  constructor() {
    this.deviceActionTable = {};
    this.deviceValuesTable = {};
    this.callbacks = {
      update: {},
    };
  }

  async init() {}

  register(actionModel) {
    if (!(actionModel.deviceId in this.deviceActionTable)) {
      this.deviceActionTable[actionModel.deviceId] = {};
      this.deviceValuesTable[actionModel.deviceId] = {};
      this.callbacks.update[actionModel.deviceId] = [];
    }

    if (this.deviceActionTable[actionModel.deviceId][actionModel.id]) {
      const current =
        this.deviceActionTable[actionModel.deviceId][actionModel.id];
      actionModel.triggeredAt = current.triggeredAt;

      logger.info({
        name: "action_changed",
        model: actionModel.dump(),
      });
    } else {
      logger.info({
        name: "action_registered",
        model: actionModel.dump(),
      });
    }

    this.deviceActionTable[actionModel.deviceId][actionModel.id] = actionModel;
  }

  unregister(actionModel) {
    if (!(actionModel.deviceId in this.deviceActionTable)) {
      return;
    }

    logger.info({
      name: "action_unregistered",
      model: actionModel.dump(),
    });

    delete this.deviceActionTable[actionModel.deviceId][actionModel.id];
  }

  getActions(deviceId) {
    return (this.deviceActionTable[deviceId] ??= {});
  }

  getValues(deviceId) {
    return (this.deviceValuesTable[deviceId] ??= {});
  }

  update(deviceId, sensorName, sensorValue) {
    const actions = this.getActions(deviceId);
    const values = this.getValues(deviceId);

    (this.callbacks.update[deviceId] ??= []).forEach((cb) => {
      try {
        cb(sensorName, sensorValue);
      } catch (error) {
        logger.error({
          name: "actionRunner_callbackRunError",
          error,
        });
      }
    });

    values[sensorName] = sensorValue;

    // logger.info({
    //   name: "action_runner_update",
    //   deviceId,
    //   sensorName,
    //   sensorValue,
    //   effectedActionCount: Object.keys(actions).length,
    // });

    for (const action_id in actions) {
      const action = actions[action_id];
      action.trigger(values);
    }
  }

  addUpdateListener(deviceId, callback) {
    (this.callbacks.update[deviceId] ??= []).push(callback);
  }

  removeUpdateListener(deviceId, callback) {
    const index = this.callbacks.update[deviceId].findIndex(
      (cb) => cb === callback,
    );
    if (index !== -1) {
      this.callbacks.update[deviceId].splice(index);
      return true;
    }
    return false;
  }

  removeUpdateListeners(deviceId) {
    this.callbacks.update[deviceId] = [];
  }
}

const actionRunner = new ActionRunner();

module.exports = {
  Action,
  TelegramAction,
  EmailAction,
  PowerOnDeviceAction,
  WebHookAction,
  ActionModel,
  ActionRunner,
  actionRunner,
};

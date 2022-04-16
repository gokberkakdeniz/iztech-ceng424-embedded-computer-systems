import { compileExpression } from "filtrex";
import db from "./db.js";

export class ActionModel {
  constructor(raw) {
    this.id = raw.id;
    this.name = raw.id;
    this.type = raw.type;
    this.deviceId = raw.device_id;
    this.triggeredAt = raw.triggered_at;
    this.condition = raw.condition;
    this.waitFor = Number.parseFloat(raw.wait_for);
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

        const [, err] = await db.queryOne(
          "UPDATE actions SET triggered_at = $1 WHERE id = $2",
          [this.triggeredAt, this.id],
        );

        if (err) {
          console.log(
            "[ACTION]",
            "Could not update triggered at of ",
            this.dump(),
          );
        }

        console.log("[ACTION]", this.dump());
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

export class ActionRunner {
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

    if (this.deviceActionTable[actionModel.deviceId][actionModel.id]) return;

    this.deviceActionTable[actionModel.deviceId][actionModel.id] = actionModel;
  }

  unregister(actionModel) {
    if (!(actionModel.deviceId in this.deviceActionTable)) {
      return;
    }

    delete this.deviceActionTable[actionModel.deviceId][actionModel.id];
  }

  getActions(deviceId) {
    return this.deviceActionTable[deviceId];
  }

  getValues(deviceId) {
    return this.deviceValuesTable[deviceId];
  }

  update(deviceId, sensorName, sensorValue) {
    const actions = this.getActions(deviceId);
    const values = this.getValues(deviceId);

    if (!actions || !values) return;

    this.callbacks.update[deviceId].forEach((cb) =>
      cb(sensorName, sensorValue),
    );

    values[sensorName] = sensorValue;

    for (const action_id in actions) {
      const action = actions[action_id];
      action.trigger(values);
    }
  }

  addUpdateListener(deviceId, callback) {
    this.callbacks.update[deviceId].push(callback);
  }

  removeUpdateListener(deviceId, callback) {
    const index = this.callbacks.update[deviceId].findIndex(callback);
    if (index !== -1) this.callbacks.update[deviceId].splice(index);
  }

  removeUpdateListeners(deviceId) {
    this.callbacks.update[deviceId] = [];
  }
}

export const actionRunner = new ActionRunner();

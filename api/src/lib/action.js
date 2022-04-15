const { compileExpression } = require("filtrex");

class ActionModel {
  constructor(raw) {
    this.id = raw.id;
    this.name = raw.id;
    this.type = raw.type;
    this.deviceId = raw.device_id;
    this.triggeredAt = raw.triggered_at;
    this.condition = raw.condition;
    this.waitFor = raw.wait_for;
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

  trigger(values) {
    if (this.evaluateCondition(values)) {
      const now = new Date();

      if (!this.triggeredAt || this.nextRun <= now) {
        this.triggeredAt = now;
        this.setNextRun();

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

class ActionRunner {
  constructor() {
    this.deviceActionTable = {};
    this.deviceValuesTable = {};
  }

  async init() {}

  register(actionModel) {
    if (!(actionModel.deviceId in this.deviceActionTable)) {
      this.deviceActionTable[actionModel.deviceId] = {};
      this.deviceValuesTable[actionModel.deviceId] = {};
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

    values[sensorName] = sensorValue;

    for (const action_id in actions) {
      const action = actions[action_id];
      action.trigger(values);
    }
  }
}

const actionRunner = new ActionRunner();

module.exports = {
  ActionModel,
  ActionRunner,
  actionRunner,
};

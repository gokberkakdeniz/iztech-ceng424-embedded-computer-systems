class UpdateSensorsDictionary {
  constructor() {
    this.dict = {};
  }

  set(deviceId, status = null) {
    if (!status) {
      delete this.dict[deviceId];
    } else {
      this.dict[deviceId] = status;
    }
  }

  get(deviceId) {
    return this.dict[deviceId];
  }
}

module.export = new UpdateSensorsDictionary();

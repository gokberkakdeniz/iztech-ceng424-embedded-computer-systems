const { actionRunner } = require("./action");
const db = require("./db");
const logger = require("./logger");

class UpdateSensorsDictionary {
  constructor() {
    this.dict = {};
  }

  set(deviceId, status = null) {
    logger.info({
      name: "update-sensors-status",
      deviceId,
      status: {
        prev: this.dict[deviceId],
        next: status,
      },
    });

    if (!status) {
      delete this.dict[deviceId];
    } else {
      this.dict[deviceId] = status;
    }

    if (status === "checking") {
      const sensorsStatusTable = {};

      db.getDeviceSensorsWithOutputAsTree(deviceId).then(
        ([sensors, sensorsErr]) => {
          if (sensorsErr) {
            logger.error({
              name: "update-sensors-status",
              deviceId: deviceId,
              status: status,
              error: sensorsErr,
            });
            return this.set(deviceId, "check_fetch_error");
          }

          for (const sensor of sensors) {
            if (sensor.active) {
              for (const output of sensor.outputs) {
                if (output.active) {
                  sensorsStatusTable[
                    `${sensor.name}_${output.name}`.toLowerCase()
                  ] = false;
                }
              }
            }
          }

          let timeoutId = null;

          const sensorChecker = (sensorName, _sensorValue) => {
            if (typeof sensorName !== "string") {
              return logger.error({
                name: "sensorChecker_whatTheHell?",
                sensorName,
                _sensorValue,
              });
            }
            sensorsStatusTable[sensorName.toLowerCase()] = true;
            if (Object.values(sensorsStatusTable).every(Boolean)) {
              actionRunner.removeUpdateListener(deviceId, sensorChecker);
              if (timeoutId) clearTimeout(timeoutId);
              this.set(deviceId, "done");
            }
          };

          actionRunner.addUpdateListener(deviceId, sensorChecker);

          timeoutId = setTimeout(() => {
            console.log("setTimeout");
            timeoutId = null;

            actionRunner.removeUpdateListener(deviceId, sensorChecker);

            if (Object.values(sensorsStatusTable).every(Boolean)) {
              this.set(deviceId, "done");
            } else {
              const failedOnes = Object.entries(sensorsStatusTable)
                .filter(([, v]) => !v)
                .map(([k]) => k)
                .join("|");
              this.set(deviceId, `check_failed|${failedOnes}`);
            }
          }, 15 * 1000);
        },
      );
    }
  }

  get(deviceId) {
    return this.dict[deviceId];
  }
}

module.exports = new UpdateSensorsDictionary();

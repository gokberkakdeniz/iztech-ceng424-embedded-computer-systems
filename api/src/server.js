require("dotenv").config();

const Express = require("express");
const Next = require("next");
const { json } = require("body-parser");
const { connect } = require("mqtt");
const { ironSession } = require("iron-session/express");
const { unsealData } = require("iron-session");
const { WebSocketServer } = require("ws");
const cookie = require("cookie");
const { actionRunner, ActionModel } = require("./lib/action.js");
const updateSensorsDictionary = require("./lib/sensor.js");
const logger = require("./lib/logger.js");
const db = require("./lib/db.js");
const { sessionOptions } = require("./lib/session.js");
const AsyncLock = require("async-lock");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 8001;
const intervalPort = process.env.INTERNAL_PORT || 8001;

const next = Next({ dev });
const handle = next.getRequestHandler();

const createMQTTClient = () => {
  const lock = new AsyncLock();
  const client = connect(
    `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
    {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    },
  );

  client.on("connect", function () {
    client.subscribe("#");
  });

  client.on("message", async function (topic, message) {
    const [deviceId, ...rest] = topic.split("/");
    const deviceTopic = rest.join("_");

    if (rest.at(-1) === "error") {
      lock
        .acquire(`${deviceId}/error`, async () => {
          const sensorErrorRecord = {
            deviceId,
            time: new Date(),
            name: deviceTopic.replace(/_error$/, ""),
          };

          const [, sensorErrorErr] = await db.createSensorError(
            sensorErrorRecord,
          );
          if (sensorErrorErr)
            return logger.error({
              name: "mqtt_onmessage_createSensorError",
              record: sensorErrorRecord,
              error: sensorErrorErr,
            });

          const [errCount, errCountError] =
            await db.getDeviceErrorCountBySensors(deviceId);

          if (errCountError)
            return logger.error({
              name: "mqtt_onmessage_getDeviceErrorCountError",
              record: { deviceId },
              error: errCountError,
            });

          logger.info({
            name: "mqtt_onmessage_getDeviceErrorCount",
            record: { deviceId, errCount },
          });

          if (errCount.some((se) => se.count > 10)) {
            logger.info({
              name: "mqtt_onmessage_resettingDevice__toMuchError",
              record: { deviceId, errCount },
            });

            const [, devResetErr] = await db.createDeviceReset(deviceId);

            if (devResetErr) {
              return logger.error({
                name: "mqtt_onmessage_deviceResetDatabaseError",
                record: { deviceId },
                error: devResetErr,
              });
            }

            client.publish(`${deviceId}/cmd/reset`, "", async (pubErr) => {
              if (pubErr) {
                return logger.error({
                  name: "mqtt_onmessage_publishResetFail",
                  record: { deviceId },
                  error: pubErr,
                });
              }
            });
          }
        })
        .catch((err) => {
          logger.error({
            name: "mqtt_onmessage_error_asyncLock",
            record: { deviceId },
            error: err,
          });
        });
    } else if (deviceTopic === "dev_start") {
      logger.info({
        name: "mqtt_onmessage_devStart",
        record: { deviceId },
      });

      await fetch(
        `http://localhost:${process.env.INTERNAL_PORT}/update-sensors-status/${deviceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "started" }),
        },
      ).catch(console.error);

      const [
        [deviceSensors, deviceSensorErr],
        [deviceSensorOutputs, deviceSensorOutputsErr],
      ] = await Promise.all([
        db.getDeviceSensors(deviceId),
        db.getDeviceSensorOutputs(deviceId),
      ]);

      if (deviceSensorOutputsErr || deviceSensorErr) {
        fetch(
          `http://localhost:${process.env.INTERNAL_PORT}/update-sensors-status/${deviceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "sensors_fetch_failed" }),
          },
        ).catch(console.error);

        // TODO: think what should we do?
        return logger.error({
          name: "mqtt_onmessage_start_deviceSensorOutputsErr",
          record: { deviceId },
          error: {
            deviceSensorOutputsErr,
            deviceSensorErr,
          },
        });
      }

      const buffer = new Uint8Array([
        deviceSensors.length,
        ...deviceSensors.flatMap(({ sensor_id, pin }) => [sensor_id, pin]),
        ...deviceSensorOutputs,
      ]);

      logger.info({
        name: "mqtt_onmessage_sensorPayload",
        record: { deviceId, message: buffer },
      });

      client.publish(`${deviceId}/cmd/sensors`, buffer, (pubErr) => {
        if (pubErr) {
          fetch(
            `http://localhost:${process.env.INTERNAL_PORT}/update-sensors-status/${deviceId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "sensors_publish_failed" }),
            },
          ).catch(console.error);
        } else {
          fetch(
            `http://localhost:${process.env.INTERNAL_PORT}/update-sensors-status/${deviceId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "checking" }),
            },
          ).catch(console.error);
        }
      });
    } else if (
      deviceTopic.startsWith("dev_") ||
      deviceTopic.startsWith("cmd_")
    ) {
      logger.info({
        name: "mqtt_onmessage_deviceTopic",
        record: { deviceId, deviceTopic },
      });
    } else {
      const value = Number.parseFloat(message);

      const sensorValueRecord = {
        deviceId,
        value,
        time: new Date(),
        name: deviceTopic,
      };

      db.createSensorValue(sensorValueRecord).then(([, err]) => {
        if (err)
          logger.error({
            name: "mqtt_onmessage_createSensorValue",
            record: sensorValueRecord,
            error: err,
          });
      });

      actionRunner.update(deviceId, deviceTopic, value);
    }

    // logger.info({
    //   name: "mqtt_onmessage",
    //   topic: topic,
    //   message: message.toString(),
    // });
  });

  return client;
};

const loadActions = () =>
  db.getActions(true).then(([actions, error]) => {
    if (error) throw error;

    actions.forEach((action) => {
      actionRunner.register(new ActionModel(action));
    });

    logger.info({
      name: "actions_loaded",
      count: actions.length,
    });

    if (error) throw error;
  });

const createInternalServer = (mqttClient) => {
  const app = Express();

  app.use(json());

  app.get("/action-runner", (req, res) => {
    res.send(actionRunner);
  });

  app.post("/action-runner", (req, res) => {
    const body = req.body;

    logger.info({
      name: "action-runner-put",
      data: body,
    });

    const model = new ActionModel(body);

    actionRunner.register(model);

    res.send({ data: model });
  });

  app.delete("/action-runner", (req, res) => {
    const body = req.body;

    logger.info({
      name: "action-runner-delete",
      data: body,
    });

    const model = new ActionModel(body);

    actionRunner.unregister(model);

    res.send({ data: model });
  });

  app.get("/update-sensors-status", (req, res) => {
    res.send(updateSensorsDictionary);
  });

  app.get("/update-sensors-status/:deviceId", (req, res) => {
    res.send({
      status: updateSensorsDictionary.get(req.params.deviceId),
    });
  });

  app.post("/update-sensors-status/:deviceId", (req, res) => {
    if (req.body.status === updateSensorsDictionary.get(req.params.deviceId)) {
      res.send({
        status: updateSensorsDictionary.get(req.params.deviceId),
      });

      return;
    }

    updateSensorsDictionary.set(req.params.deviceId, req.body.status);

    if (req.body.status === "restarting") {
      mqttClient.publish(`${req.params.deviceId}/cmd/reset`, "", (pubErr) => {
        if (pubErr) {
          updateSensorsDictionary.set(req.params.deviceId, "restart_failed");

          return logger.error({
            name: "mqtt_onmessage_publishResetFail",
            record: { deviceId: req.params.deviceId },
            error: pubErr,
          });
        }
      });
    }

    return res.send({
      status: updateSensorsDictionary.get(req.params.deviceId),
    });
  });

  return app.listen(intervalPort, (err) => {
    if (err) throw err;

    logger.info({
      name: "internal_server_started",
      url: "http://localhost:" + intervalPort,
    });
  });
};

const createServer = () => {
  const app = Express();
  app.use(Express.static("public"));
  app.use(json());
  app.use(ironSession(sessionOptions));

  app.all("*", (req, res) => {
    return handle(req, res);
  });

  return app.listen(port, (err) => {
    if (err) throw err;

    logger.info({
      name: "server_started",
      url: "http://localhost:" + port,
    });
  });
};

const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({
    noServer: true,
  });

  wss.on("connection", function connection(ws, req) {
    // TODO: check if deviceId belongs to the user

    const params = new URLSearchParams(req.url.substring(4));
    const deviceId = params.get("deviceId");

    logger.info({
      name: "ws_subscribed",
      deviceId: deviceId,
    });

    const callback = (name, value) => {
      ws.send(JSON.stringify({ name, value }));
    };

    actionRunner.addUpdateListener(deviceId, callback);

    ws.on("message", (data) => {
      logger.info({
        name: "ws_onmessage",
        deviceId: deviceId,
        message: data,
      });
    });

    ws.on("close", () => {
      actionRunner.removeUpdateListener(deviceId, callback);

      logger.info({
        name: "ws_unsubscribed",
        deviceId: deviceId,
      });
    });
  });

  server.on("upgrade", async (req, socket, head) => {
    if (req.url.startsWith("/ws")) {
      const { [sessionOptions.cookieName]: sessionCookie = "" } = cookie.parse(
        req.headers.cookie || "",
      );
      const unsealed = await unsealData(sessionCookie, sessionOptions);

      req.session = { ...(req.session || {}), ...unsealed };

      if (!req.session.user) {
        logger.info({
          name: "ws_unauthorized",
        });

        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();

        return;
      }

      wss.handleUpgrade(req, socket, head, (websocket) => {
        wss.emit("connection", websocket, req);
      });
    }
  });
};

next.prepare().then(async () => {
  const server = createServer();
  createWebSocketServer(server);

  await loadActions();
  createInternalServer(createMQTTClient());
});

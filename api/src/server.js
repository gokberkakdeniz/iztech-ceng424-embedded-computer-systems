import "dotenv/config.js";

import Express from "express";
import Next from "next";
import { json } from "body-parser";
import { connect } from "mqtt";
import { ironSession } from "iron-session/express";
import { unsealData } from "iron-session";
import { WebSocketServer } from "ws";
import cookie from "cookie";
import { actionRunner, ActionModel } from "./lib/action.js";
import logger from "./lib/logger.js";
import db from "./lib/db.js";
import { sessionOptions } from "./lib/session.js";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 8001;
const intervalPort = process.env.INTERNAL_PORT || 8001;

const next = Next({ dev });
const handle = next.getRequestHandler();

const createMQTTClient = () => {
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

  client.on("message", function (topic, message) {
    const [deviceId, ...rest] = topic.split("/");
    const sensor = rest.join("_");
    const value = Number.parseFloat(message);

    const sensorValueRecord = {
      deviceId,
      value,
      time: new Date(),
      name: sensor,
    };

    db.createSensorValue(sensorValueRecord).then(([, err]) => {
      if (err)
        logger.error({
          name: "mqtt_onmessage_createSensorValue",
          record: sensorValueRecord,
          error: err,
        });
    });

    actionRunner.update(deviceId, sensor, value);

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

const createInternalServer = () => {
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
  createInternalServer();

  const server = createServer();
  createWebSocketServer(server);

  await loadActions();
  createMQTTClient();
});

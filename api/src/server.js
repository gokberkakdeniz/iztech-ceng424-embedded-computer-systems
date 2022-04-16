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
import db from "./lib/db.js";
import { sessionOptions } from "./lib/session.js";

const dev = process.env.NODE_ENV !== "production";
const port = dev ? process.env.PORT || 8001 : 80;
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
        console.log(
          `[SENSOR_VALUE] An error occured while inserting sensor data.`,
          sensorValueRecord,
          err,
        );
    });

    actionRunner.update(deviceId, sensor, value);
    // console.log(`[MQTT] ${topic}: ${message.toString()}`);
  });

  return client;
};

const loadActions = () =>
  db.getActions().then(([actions, error]) => {
    if (error) throw error;

    actions.forEach((action) => {
      actionRunner.register(new ActionModel(action));
    });
    console.log(`[ACTION] ${actions.length} actions registered.`);

    if (error) throw error;
  });

const createServer = () => {
  const app = Express();

  app.use(json());
  app.use(ironSession(sessionOptions));

  // add custom path here
  // server.post('/request/custom', custom);

  app.all("*", (req, res) => {
    return handle(req, res);
  });

  return app.listen(port, (err) => {
    if (err) throw err;
    console.log("Ready on http://localhost:" + port);
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

    console.log(`[WS] subscribed to ${deviceId}`);

    const callback = (name, value) => {
      ws.send(JSON.stringify({ name, value }));
    };

    actionRunner.addUpdateListener(deviceId, callback);

    ws.on("message", (data) => {
      console.log(`[WS] message from  ${deviceId}: ${data}`);
    });

    ws.on("close", () => {
      actionRunner.removeUpdateListener(deviceId, callback);
      console.log(`[WS] unsubscribed #${deviceId}`);
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
  createMQTTClient();
});

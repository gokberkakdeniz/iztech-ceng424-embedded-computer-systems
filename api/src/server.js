require("dotenv").config();
const express = require("express");
const next = require("next");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");
const { actionRunner, ActionModel } = require("./lib/action");

const dev = process.env.NODE_ENV !== "production";
const port = dev ? process.env.PORT || 8001 : 80;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(bodyParser.json());

  // add custom path here
  // server.post('/request/custom', custom);

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log("Ready on http://localhost:" + port);
  });
});

actionRunner.register(
  new ActionModel({
    id: "1",
    name: "dht",
    device_id: "00A9F7DF",
    condition: "dht > 1",
    wait_for: 5,
  }),
);

actionRunner.register(
  new ActionModel({
    id: "2",
    name: "dht and temp",
    device_id: "00A9F7DF",
    condition: "dht > 1 and temp > 1",
    wait_for: 5,
  }),
);

const client = mqtt.connect(
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
  const [deviceId, sensor] = topic.split("/");
  actionRunner.update(deviceId, sensor, Number.parseFloat(message));
  console.log(`[MQTT] ${topic}: ${message.toString()}`);
});

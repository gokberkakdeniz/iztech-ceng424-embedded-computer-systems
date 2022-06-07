import db from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { DeviceSensorsBody } from "../../../../lib/validation";
import * as ss from "superstruct";

async function getDeviceSensors(req, res) {
  if (req.query.deviceId?.length !== 8) {
    return res.send({ error: true, message: "id must have 8 characters." });
  }

  const [device, err] = await db.getDeviceById(req.query.deviceId);

  if (err) {
    logger.error(err);
    return res.send({ error: true, message: "unknown error." });
  }

  if (!device || device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [rawData, rawDataErr] = await db.queryAll(
    `select 
      so.sensor_id, s.name as sensor_name, s.type as sensor_type, 
      so.id as output_id, so.name as output_name,
      ds.pin,
      (dso.device_id is not null) as active
    from 
      sensors s 
      left join sensor_outputs so ON s.id = so.sensor_id
      left outer join device_sensors ds ON ds.sensor_id = so.sensor_id and ds.device_id = $1
      left outer join device_sensor_outputs dso ON dso.sensor_output_id = so.id and dso.device_id = $1
    `,
    [req.query.deviceId],
  );

  if (rawDataErr) {
    logger.error(rawDataErr);
    return res.send({ error: true, message: "unknown error." });
  }

  const result = {};

  for (const record of rawData) {
    if (!result[record.sensor_id]) {
      result[record.sensor_id] = {
        id: Number.parseInt(record.sensor_id),
        name: record.sensor_name,
        type: record.sensor_type,
        pin: Number.parseInt(record.pin),
        active: record.pin !== null,
        outputs: [],
      };
    }

    result[record.sensor_id].outputs.push({
      id: Number.parseInt(record.output_id),
      name: record.output_name,
      active: record.active,
    });
  }

  res.send({ error: false, data: Object.values(result) });
}

async function updateDeviceSensors(req, res) {
  const [bodyErr, body] = ss.validate(req.body, DeviceSensorsBody);

  if (bodyErr) {
    return res.status(500).send({ error: true, message: bodyErr.message });
  }

  if (req.query.deviceId?.length !== 8) {
    return res.send({ error: true, message: "id must have 8 characters." });
  }

  const [device, err] = await db.getDeviceById(req.query.deviceId);

  if (err) {
    logger.error(err);
    return res.send({ error: true, message: "unknown error." });
  }

  if (!device || device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [client, clientErr] = await db.connect();

  if (clientErr) {
    logger.error(clientErr);
    return res.send({ error: true, message: "pool connect failed." });
  }

  let success = true;
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM device_sensor_outputs WHERE device_id = $1",
      [req.query.deviceId],
    );
    await client.query(
      "DELETE FROM device_sensors WHERE device_id = $1",
      [req.query.deviceId],
    );
    const activeSensors = body.filter((s) => s.active);
    const activeSensorValues = activeSensors.map((s) => [s.id, s.pin]);
    const activeSensorOutputValues = activeSensors.flatMap((s) =>
      s.outputs.filter((so) => so.active).map((so) => so.id),
    );

    if (activeSensorValues.length > 0) {
      await client.query(
        `INSERT INTO device_sensors VALUES ${activeSensorValues
          .map((_, i) => `($1, $${2 * i + 2}, $${2 * i + 3})`)
          .join(", ")}`,
        [req.query.deviceId, ...activeSensorValues.flat()],
      );

      if (activeSensorOutputValues.length > 0) {
        await client.query(
          `INSERT INTO device_sensor_outputs VALUES ${activeSensorOutputValues
            .map((_, i) => `($1, $${i + 2})`)
            .join(", ")}`,
          [req.query.deviceId, ...activeSensorOutputValues.flat()],
        );
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    success = false;
    logger.error(e);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }

  if (!success) {
    return res.send({ error: true, message: "transaction failed" });
  }

  res.send({ error: false, data: true });
}

export default async function deviceSensorsRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "POST":
      await updateDeviceSensors(req, res);
      break;
    case "GET":
      await getDeviceSensors(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

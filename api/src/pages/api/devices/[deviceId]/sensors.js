import db from "../../../../lib/db";
import logger from "../../../../lib/logger";

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
  res.send({ error: false, data: "not implemented." });
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

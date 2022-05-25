import db from "../../../../../lib/db";
import logger from "../../../../../lib/logger";

async function getValues(req, res) {
  const [device, err] = await db.getDeviceById(req.query.deviceId);

  if (err) {
    logger.error(err);
    return res.send({ error: true, message: "unknown error." });
  }

  if (!device || device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [sensorNames, sensorNamesErr] = await db.getSensorsByDeviceId(
    req.query.deviceId,
  );

  if (sensorNamesErr) {
    logger.error(sensorNamesErr);
    return res.send({ error: true, message: "unknown error." });
  }

  const sensors = req.query.sensors?.split(",") ?? [];

  if (sensors.some((s) => !sensorNames.includes(s))) {
    return res.send({ error: true, message: "invalid sensor" });
  }

  if (sensors.length === 0) {
    sensors.push(...sensorNames);
  }

  const aggregate = req.query.aggregate;
  const offset = req.query.offset;
  const order = req.query.order;

  const [result, resultErr] = await db.getSensorTimeseries(req.query.deviceId, {
    sensors,
    aggregate,
    offset,
    order,
  });

  if (resultErr) {
    logger.error(resultErr);
    return res.send({ error: true, message: "unknown error." });
  }

  res.send({ error: false, data: result });
}

export default async function deviceSensorValuesRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "GET":
      await getValues(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

import db from "../../../../../lib/db";
import logger from "../../../../../lib/logger";

async function getSummary(req, res) {
  const [device, devErr] = await db.getDeviceById(req.query.deviceId);

  if (devErr) {
    logger.error(devErr);
    return res.send({ error: true, message: "unknown error." });
  }

  if (!device || device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [lastValues, lastValuesErr] = await db.getLatestSensorValuesByDeviceId(
    req.query.deviceId,
  );

  const [statsData, statsErr] = await db.getSensorValueCountByDeviceId(
    req.query.deviceId,
  );

  const initialData = lastValuesErr ? {} : lastValues;
  const statistics = statsErr ? {} : statsData;

  statistics.__total__ = Object.values(statistics).reduce(
    (pre, curr) => pre + curr,
    0,
  );

  return res.send({ error: true, data: { initialData, statistics } });
}

export default async function deviceSensorValuesSummaryRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "GET":
      await getSummary(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

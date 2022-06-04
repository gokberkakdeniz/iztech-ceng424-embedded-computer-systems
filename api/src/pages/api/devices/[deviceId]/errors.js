import db from "../../../../lib/db";
import logger from "../../../../lib/logger";

async function getErrors(req, res) {
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

  const [sensorErrors, sensorErrorsError] = await db.getAllSensorErrors(
    req.query.deviceId,
  );
  if (sensorErrorsError) {
    logger.error(sensorErrorsError);
    return res.send({ error: true, message: "unknown error." });
  }

  res.send({ error: false, data: sensorErrors });
}
export default async function deviceSensorErrorsRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "GET":
      await getErrors(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

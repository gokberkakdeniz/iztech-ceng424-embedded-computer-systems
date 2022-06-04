import db from "../../../../lib/db";
import logger from "../../../../lib/logger";

async function getResets(req, res) {
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

  const [deviceResets, deviceResetsErr] = await db.getAllDeviceResets(
    req.query.deviceId,
  );
  if (deviceResetsErr) {
    logger.error(deviceResetsErr);
    return res.send({ error: true, message: "unknown error." });
  }

  res.send({ error: false, data: deviceResets });
}
export default async function deviceResetsRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "GET":
      await getResets(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

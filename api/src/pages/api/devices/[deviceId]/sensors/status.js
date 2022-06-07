import db from "../../../../../lib/db";
import logger from "../../../../../lib/logger";

async function getUpdateSensorsStatus(req, res) {
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

  try {
    const { status } = await fetch(
      `http://localhost:${process.env.INTERNAL_PORT}/update-sensors-status/${req.query.deviceId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    ).then((r) => r.json());

    return res.send({ error: false, data: status });
  } catch (e) {
    return res.send({ error: true, data: "could not fetch status." });
  }
}

export default async function deviceSensorsRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "GET":
      await getUpdateSensorsStatus(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

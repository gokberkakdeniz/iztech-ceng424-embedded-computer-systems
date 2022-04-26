import db from "../../../../../lib/db";
import * as ss from "superstruct";
import * as uuid from "uuid";
import { ActionBody } from "../../../../../lib/validation";
import logger from "../../../../../lib/logger";

async function createAction(req, res) {
  if (req.query.deviceId?.length !== 8) {
    return res.send({ error: true, message: "id must have 8 characters." });
  }

  const [err, body] = ss.validate(req.body, ActionBody);

  if (err) {
    res.status(500).send({ error: true, message: err.message });
  } else {
    body.id = uuid.v4();
    body.ownerId = req.session.user.id;
    body.deviceId = req.query.deviceId;

    const [action, err] = await db.createAction(body);

    if (err) {
      logger.error({
        name: "create_action_error",
        error: err,
      });

      return res.send({ error: true, message: "unknown error." });
    }

    fetch(`http://localhost:${process.env.INTERNAL_PORT}/action-runner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action),
    });

    res.status(200).send({ error: false, data: action });
  }
}

async function getActions(req, res) {
  if (req.query.deviceId?.length !== 8) {
    return res.send({ error: true, message: "id must have 8 characters." });
  }

  const [device, deviceErr] = await db.getDeviceById(req.query.deviceId);

  if (deviceErr) {
    logger.error({
      name: "get_actions_err",
      error: deviceErr,
    });

    return res.send({ error: true, message: "unknown error." });
  }

  if (!device || device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [actions, actionsErr] = await db.getActionsByDeviceId(
    req.query.deviceId,
  );

  if (actionsErr) {
    logger.error({
      name: "get_actions_err",
      error: actionsErr,
    });

    return res.send({ error: true, message: "unknown error." });
  }

  res.send({ error: false, data: actions });
}

export default async function actionsRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "POST":
      await createAction(req, res);
      break;
    case "GET":
      await getActions(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

import db from "../../../../../lib/db";
import logger from "../../../../../lib/logger";
import * as isUuid from "is-uuid";
import * as ss from "superstruct";
import { ActionBody } from "../../../../../lib/validation";

async function editAction(req, res) {
  if (!isUuid.v4(req.query.actionId)) {
    return res.send({ error: true, message: "id must be uuid v4." });
  }

  const [err, body] = ss.validate(req.body, ActionBody);

  if (err) {
    return res.status(500).send({ error: true, message: err.message });
  }

  const [action, actionErr] = await db.getActionById(req.query.actionId);

  if (!action) {
    return res.send({ error: true, message: "action not found." });
  } else if (actionErr) {
    logger.error({
      name: "edit_action_error",
      error: actionErr,
    });

    return res.send({
      error: true,
      message: "error occured while fetching action.",
    });
  }

  const [device, deviceErr] = await db.getDeviceById(action.device_id);

  if (!device) {
    return res.send({ error: true, message: "device not found." });
  } else if (deviceErr) {
    logger.error({
      name: "edit_action_error",
      error: deviceErr,
    });

    return res.send({
      error: true,
      message: "error occured while fetching device.",
    });
  } else if (device.owner_id != req.session.user.id) {
    return res.send({
      error: true,
      message: "this action does not belong you.",
    });
  }

  body.id = req.query.actionId;

  const [updatedAction, updatedActionErr] = await db.updateAction(body);

  if (updatedActionErr) {
    logger.error({
      name: "edit_action_error",
      error: updatedActionErr,
    });

    return res.send({
      error: true,
      message: "an error occured while updating action.",
    });
  }

  fetch(`http://localhost:${process.env.INTERNAL_PORT}/action-runner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedAction),
  });

  res.send({ error: false, data: updatedAction });
}

async function getAction(req, res) {
  if (!isUuid.v4(req.query.actionId)) {
    return res.send({ error: true, message: "id must be uuid v4." });
  }

  const [action, actionErr] = await db.getActionById(req.query.actionId);

  if (!action) {
    return res.send({ error: true, message: "not found" });
  } else if (actionErr) {
    logger.error({
      name: "get_action_error",
      error: actionErr,
    });

    return res.send({ error: true, message: "unknown error." });
  }

  const [device, deviceErr] = await db.getDeviceById(action.device_id);

  if (deviceErr) {
    logger.error({
      name: "get_action_error",
      error: deviceErr,
    });

    return res.send({ error: true, message: "unknown error." });
  } else if (device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  res.send({ error: false, data: action });
}

async function deleteAction(req, res) {
  if (!isUuid.v4(req.query.actionId)) {
    return res.send({ error: true, message: "id must be uuid v4." });
  }

  const [action, err] = await db.getActionById(req.query.actionId);

  if (err) {
    logger.error({
      name: "delete_action_error",
      error: err,
    });

    return res.send({ error: true, message: "unknown error." });
  } else if (!action) {
    return res.send({ error: true, message: "not found" });
  }

  const [device, deviceErr] = await db.getDeviceById(action.device_id);
  if (deviceErr) {
    logger.error({
      name: "delete_action_error",
      error: deviceErr,
    });

    return res.send({ error: true, message: "unknown error." });
  } else if (device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [deletedAction, deleteErr] = await db.deleteActionById(action.id);

  if (deleteErr) {
    logger.error({
      name: "delete_action_error",
      error: deleteErr,
    });

    return res.send({ error: true, message: "unknown error." });
  }

  deletedAction.props = {}; // sorry...

  fetch(`http://localhost:${process.env.INTERNAL_PORT}/action-runner`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deletedAction),
  });

  res.send({ error: false, data: deletedAction });
}

export default async function deviceRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "POST":
      await editAction(req, res);
      break;
    case "GET":
      await getAction(req, res);
      break;
    case "DELETE":
      await deleteAction(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}

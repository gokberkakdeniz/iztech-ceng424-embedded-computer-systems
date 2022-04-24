import db from "../../../../../lib/db";
import { ActionModel, actionRunner } from "../../../../../lib/action";
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
    console.log(actionErr);
    return res.send({
      error: true,
      message: "error occured while fetching action.",
    });
  }

  const [device, deviceErr] = await db.getDeviceById(action.device_id);

  if (!device) {
    return res.send({ error: true, message: "device not found." });
  } else if (deviceErr) {
    console.log(deviceErr);
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
    console.log(updatedActionErr);
    return res.send({
      error: true,
      message: "an error occured while updating action.",
    });
  }

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
    console.log(actionErr);
    return res.send({ error: true, message: "unknown error." });
  }

  const [device, deviceErr] = await db.getDeviceById(action.device_id);

  if (deviceErr) {
    console.log(deviceErr);
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
    console.log(err);
    return res.send({ error: true, message: "unknown error." });
  } else if (!action) {
    return res.send({ error: true, message: "not found" });
  }

  const [device, deviceErr] = await db.getDeviceById(action.device_id);
  if (deviceErr) {
    console.log(deviceErr);
    return res.send({ error: true, message: "unknown error." });
  } else if (device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [deletedAction, deleteErr] = await db.deleteActionById(action.id);

  if (deleteErr) {
    console.log(deleteErr);
    return res.send({ error: true, message: "unknown error." });
  }

  actionRunner.unregister(new ActionModel(deletedAction));

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

import { withIronSessionApiRoute } from "iron-session/next";
import db from "../../../../../lib/db";
import { sessionOptions } from "../../../../../lib/session";
import * as isUuid from "is-uuid";

async function editAction(req, res) {
  res.send({ error: false, message: "OK editAction" });
}

async function getAction(req, res) {
  if (!isUuid.v4(req.query.actionId)) {
    return res.send({ error: true, message: "id must be uuid v4." });
  }

  const [action, actionErr] = await db.getActionById(req.query.actionId);

  if (actionErr) {
    console.log(actionErr);
    return res.send({ error: true, message: "unknown error." });
  }

  const [device, deviceErr] = await db.getDeviceById(action.device_id);
  if (deviceErr) {
    console.log(deviceErr);
    return res.send({ error: true, message: "unknown error." });
  }

  if (!action || device.owner_id != req.session.user.id) {
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
  }

  if (!action || action.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [deletedDevice, deleteErr] = await db.deleteActionById(action.id);

  if (deleteErr) {
    console.log(deleteErr);
    return res.send({ error: true, message: "unknown error." });
  }

  res.send({ error: false, data: deletedDevice });
}

export default withIronSessionApiRoute(async function deviceRoute(req, res) {
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
}, sessionOptions);

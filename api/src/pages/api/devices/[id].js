import { withIronSessionApiRoute } from "iron-session/next";
import db from "../../../lib/db";
import { sessionOptions } from "../../../lib/session";

async function editDevice(req, res) {
  res.send({ error: false, message: "OK editDevice" });
}

async function getDevice(req, res) {
  if (req.query.id?.length !== 8) {
    return res.send({ error: true, message: "id must have 8 characters." });
  }

  const [device, err] = await db.getDeviceById(req.query.id);

  if (err) {
    console.log(err);
    return res.send({ error: true, message: "unknown error." });
  }

  if (!device || device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  delete device.password;

  res.send({ error: false, data: device });
}

async function deleteDevice(req, res) {
  if (req.query.id?.length !== 8) {
    return res.send({ error: true, message: "id must have 8 characters." });
  }

  const [device, err] = await db.getDevicesByOwnerId(req.session.user.id);

  if (err) {
    console.log(err);
    return res.send({ error: true, message: "unknown error." });
  }

  if (!device || device.owner_id != req.session.user.id) {
    return res.send({ error: true, message: "not found" });
  }

  const [deletedDevice, deleteErr] = await db.deleteDeviceById(device.id);

  if (deleteErr) {
    console.log(deleteErr);
    return res.send({ error: true, message: "unknown error." });
  }

  delete deletedDevice.password;

  res.send({ error: false, data: deletedDevice });
}

export default withIronSessionApiRoute(async function userRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "POST":
      await editDevice(req, res);
      break;
    case "GET":
      await getDevice(req, res);
      break;
    case "DELETE":
      await deleteDevice(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}, sessionOptions);

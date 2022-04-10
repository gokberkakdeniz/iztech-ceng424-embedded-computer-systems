import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "../../../lib/session";

async function createDevice(req, res) {
  res.send({ error: false, message: "OK createDevice" });
}

async function getDevices(req, res) {
  res.send({ error: false, message: "OK getDevices" });
}

export default withIronSessionApiRoute(async function userRoute(req, res) {
  if (!req.session.user) {
    return res.send({ error: true, message: "unauthorized" });
  }

  switch (req.method) {
    case "POST":
      await createDevice(req, res);
      break;
    case "GET":
      await getDevices(req, res);
      break;
    default:
      res.send({ error: true, message: "method not allowed." });
      break;
  }
}, sessionOptions);

import db from "../../../lib/db";

async function createDevice(req, res) {
  res.status(200).send({ error: false, message: "OK createDevice" });
}

async function getDevices(req, res) {
  const [devices, err] = await db.getDevicesByOwnerId(req.session.user.id);

  if (err) {
    console.log(err);
    return res.send({ error: true, message: "unknown error." });
  }

  devices.forEach((d) => {
    delete d.password;
    delete d.owner_id;
  });

  res.send({ error: false, data: devices });
}

export default async function devicesRoute(req, res) {
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
}

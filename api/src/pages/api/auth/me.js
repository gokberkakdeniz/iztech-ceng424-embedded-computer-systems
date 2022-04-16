export default function userRoute(req, res) {
  if (req.session.user) {
    res.send({ error: false, data: req.session.user });
  } else {
    res.send({ error: true, message: "unauthorized" });
  }
}

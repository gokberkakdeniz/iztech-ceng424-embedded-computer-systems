import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "../../../lib/session";

export default withIronSessionApiRoute(function userRoute(req, res) {
  if (req.session.user) {
    res.send({ error: false, data: req.session.user });
  } else {
    res.send({ error: true, message: "unauthorized" });
  }
}, sessionOptions);

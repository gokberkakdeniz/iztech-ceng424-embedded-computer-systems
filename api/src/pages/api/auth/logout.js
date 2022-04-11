import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "../../../lib/session";

export default withIronSessionApiRoute(async function loginRoute(req, res) {
  req.session.destroy();
  res.redirect("/");
}, sessionOptions);

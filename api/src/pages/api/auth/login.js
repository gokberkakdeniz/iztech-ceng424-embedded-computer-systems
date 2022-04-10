import { withIronSessionApiRoute } from "iron-session/next";
import { sessionOptions } from "../../../lib/session";
import * as ss from "superstruct";
import * as sse from "../../../lib/validation";
import db from "../../../lib/db";
import bcrypt from "bcrypt";

const LoginBody = ss.object({
  email: sse.Email,
  password: ss.size(ss.string(), 1, 32),
});

export default withIronSessionApiRoute(async function loginRoute(req, res) {
  if (req.method === "POST") {
    const [err, body] = ss.validate(req.body, LoginBody);

    if (err) {
      res.status(500).send({ error: true, message: err.message });
    } else {
      const [user, err] = await db.getUserByEmail(body.email);

      if (err) {
        console.log(err);
      }

      const isOk = await bcrypt.compare(
        body.password,
        user?.password ?? "timingAttack",
      );
      delete user.password;

      if (!isOk) {
        res.status(401).send({ error: true, message: "invalid crediantials." });
      } else {
        req.session.user = user;
        await req.session.save();
        res.status(200).send({ error: false, data: user });
      }
    }
  } else {
    res.status(405).send({ error: true, message: "method not allowed." });
  }
}, sessionOptions);

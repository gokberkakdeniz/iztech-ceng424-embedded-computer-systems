import * as ss from "superstruct";
import * as sse from "../../../lib/validation";
import db from "../../../lib/db";
import bcrypt from "bcrypt";

const LoginBody = ss.object({
  email: sse.Email,
  password: ss.size(ss.string(), 1, 32),
});

export default async function loginRoute(req, res) {
  if (req.method === "POST") {
    const [err, body] = ss.validate(req.body, LoginBody);

    if (err) {
      res.status(500).send({ error: true, message: err.message });
    } else {
      const [user, err] = await db.getUserByEmail(body.email);

      if (err) {
        console.log({
          name: "login_route_error",
          user,
          error: err,
        });
      }

      const isOk = await bcrypt.compare(
        body.password,
        user?.password ?? "timingAttack",
      );
      if (user) delete user.password;

      if (!isOk) {
        res.status(401).send({
          error: true,
          message: "The email or password is incorrect.",
        });
      } else {
        req.session.user = user;
        await req.session.save();
        res.status(200).send({ error: false, data: user });
      }
    }
  } else {
    res.status(405).send({ error: true, message: "method not allowed." });
  }
}

import bcrypt from "bcrypt";
import * as uuid from "uuid";
import * as ss from "superstruct";

import * as sse from "../../../lib/validation";
import db from "../../../lib/db";

const RegisterBody = ss.object({
  email: sse.Email,
  password: ss.size(ss.string(), 1, 32),
});

const saltRound = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS);

export default async function registerRoute(req, res) {
  if (req.method === "POST") {
    const [err, body] = ss.validate(req.body, RegisterBody);

    if (err) {
      res.status(500).send({ error: true, message: err.message });
    } else {
      body.id = uuid.v4();
      body.password = await bcrypt.hash(body.password, saltRound);
      const [user, err] = await db.createUser(body);

      if (err) {
        if (
          err.message?.includes(
            'duplicate key value violates unique constraint "users_email_key"',
          )
        ) {
          res
            .status(403)
            .send({ error: true, message: "user already registered." });
        } else {
          console.log({
            name: "register_route_error",
            user,
            error: err,
          });

          res.status(500).send({ error: true, message: "unknown error." });
        }
      } else {
        delete user.password;
        req.session.user = user;
        await req.session.save();
        res.status(200).send({ error: false, data: user });
      }
    }
  } else {
    res.status(405).send({ error: true, message: "method not allowed." });
  }
}

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  // Helpers
  queryAll: (text, params) =>
    pool
      .query(text, params)
      .then((r) => [r.rows, null])
      .catch((e) => [null, e]),
  queryOne: (text, params) =>
    pool
      .query(text, params)
      .then((r) => [r.rows[0], null])
      .catch((e) => [null, e]),
  // User
  getUserById: function (id) {
    return this.queryOne("SELECT * FROM users WHERE id = $1", [id]);
  },
  getUserByEmail: function (email) {
    return this.queryOne("SELECT * FROM users WHERE email = $1", [email]);
  },
  createUser: function (user) {
    return this.queryOne("INSERT INTO users VALUES ($1, $2, $3) RETURNING *", [
      user.id,
      user.email,
      user.password,
    ]);
  },
};

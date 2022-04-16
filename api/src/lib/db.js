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
  // Device
  getDevices: function () {
    return this.queryAll("SELECT * FROM devices");
  },
  getDevicesByOwnerId: function (id) {
    return this.queryAll(`SELECT * FROM devices WHERE owner_id = $1`, [id]);
  },
  getDeviceById: function (id) {
    return this.queryOne("SELECT * FROM devices WHERE id = $1", [id]);
  },
  deleteDeviceById: function (id) {
    return this.queryOne("DELETE devices WHERE id = $1 RETURNING *", [id]);
  },
  createDevice: function (device) {
    return this.queryOne(
      "INSERT INTO devices VALUES ($1, $2, $3) RETURNING *",
      [device.username, device.password, device.owner_id],
    );
  },
  // Actions
  getActions: function () {
    return this.queryAll("SELECT * FROM actions");
  },
  getActionsByDeviceId: function (deviceId) {
    return this.queryAll("SELECT * FROM actions where device_id = $1", [
      deviceId,
    ]);
  },
  getActionById: function (id) {
    return this.queryOne("SELECT * FROM actions where id = $1", [id]);
  },
  deleteActionById: function (id) {
    return this.queryOne("DELETE actions where id = $1", [id]);
  },
  createAction: function (action) {
    return this.queryOne(
      "INSERT INTO actions VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        action.id,
        action.deviceId,
        action.name,
        action.type,
        action.condition,
        action.triggeredAt,
        action.waitFor,
      ],
    );
  },
};

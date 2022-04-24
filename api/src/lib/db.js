import pg from "pg";
import { snakeCase } from "snake-case";

const pool = new pg.Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export default {
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
    return this.queryOne("DELETE FROM devices WHERE id = $1 RETURNING *", [id]);
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
    return this.queryOne("DELETE FROM actions WHERE id = $1 RETURNING *", [id]);
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
  updateAction: function (action) {
    const updatebleFields = ["name", "type", "condition", "waitFor"];
    const fieldsToBeUpdated = Object.keys(action).filter((column) =>
      updatebleFields.includes(column),
    );

    return this.queryOne(
      `UPDATE actions SET ${fieldsToBeUpdated.map(
        (column, index) => `${snakeCase(column)} = $${index + 2}`,
      )} WHERE id = $1 RETURNING *`,
      [action.id, ...fieldsToBeUpdated.map((column) => action[column])],
    );
  },
  // SensorValues
  createSensorValue: function (sensorValue) {
    return this.queryOne(
      "INSERT INTO sensor_values VALUES ($1, $2, $3, $4) RETURNING *",
      [
        sensorValue.deviceId,
        sensorValue.time,
        sensorValue.name,
        sensorValue.value,
      ],
    );
  },
  getSensorsByDeviceId: function (deviceId) {
    return this.queryAll(
      `SELECT DISTINCT name FROM sensor_values WHERE device_id = $1`,
      [deviceId],
    ).then(([data, err]) => [data && data.map(({ name }) => name), err]);
  },
};

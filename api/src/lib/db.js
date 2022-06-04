import pg from "pg";
import { snakeCase } from "snake-case";

const pool = new pg.Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// TODO: use transaction when appropriate
export default {
  query: (text, params, client = null) => (client ?? pool).query(text, params),
  // Helpers
  queryAll: (text, params, client = null) =>
    (client ?? pool)
      .query(text, params, (client = null))
      .then((r) => [r.rows, null])
      .catch((e) => [null, e]),
  queryOne: (text, params, client = null) =>
    (client ?? pool)
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
  getActions: async function (includeProps = false) {
    const [actionResult, actionError] = await this.queryAll(
      "SELECT * FROM actions",
    );

    if (actionError) return [actionResult, actionError];

    if (includeProps) {
      const [actionPropsResult, actionPropsError] = await this.queryAll(
        "SELECT * FROM action_properties",
      );

      if (actionPropsError) return [null, actionPropsError];

      const actionResultMap = actionResult.reduce((acc, cur) => {
        cur.props = {};
        acc[cur.id] = cur;
        return acc;
      }, {});

      actionPropsResult.forEach((prop) => {
        const { action_id, name, value } = prop;
        const action = actionResultMap[action_id];

        if (!action) return;

        if (name in action.props) {
          if (Array.isArray(action.props[name])) {
            action.props[name].push(value);
          } else {
            action.props[name] = [actionResult.props[name], value];
          }
        } else {
          action.props[name] = value;
        }
      });
    }

    return [actionResult, actionError];
  },
  getActionsByDeviceId: function (deviceId) {
    return this.queryAll("SELECT * FROM actions where device_id = $1", [
      deviceId,
    ]);
  },
  getActionById: async function (id) {
    const [actionResult, actionError] = await this.queryOne(
      "SELECT * FROM actions where id = $1",
      [id],
    );
    if (actionError || !actionResult) return [actionResult, actionError];

    const [actionPropsResult, actionPropsError] = await this.queryAll(
      `SELECT name, value FROM action_properties WHERE action_id = $1`,
      [id],
    );

    if (actionPropsError) return [actionPropsResult, actionPropsError];

    actionResult.props = {};
    actionPropsResult.forEach((prop) => {
      const { name, value } = prop;
      if (name in actionResult.props) {
        if (Array.isArray(actionResult.props[name])) {
          actionResult.props[name].push(value);
        } else {
          actionResult.props[name] = [actionResult.props[name], value];
        }
      } else {
        actionResult.props[name] = value;
      }
    });

    return [actionResult, actionError];
  },
  deleteActionById: function (id) {
    return this.queryOne("DELETE FROM actions WHERE id = $1 RETURNING *", [id]);
  },
  createAction: async function (action) {
    const [actionResult, actionError] = await this.queryOne(
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

    if (actionError) return [actionResult, actionError];

    const actionPropsEntries = Object.entries(action.props);
    const [actionPropsResult, actionPropsError] = await this.queryAll(
      `INSERT INTO action_properties VALUES ${actionPropsEntries
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(",")} RETURNING *`,
      [
        ...actionPropsEntries.flatMap(([name, value]) => [
          actionResult.id,
          name,
          value,
        ]),
      ],
    );

    if (actionPropsError) return [actionPropsResult, actionPropsError];

    actionResult.props = {};
    actionPropsResult.forEach((prop) => {
      const { name, value } = prop;
      if (name in actionResult.props) {
        if (Array.isArray(actionResult.props[name])) {
          actionResult.props[name].push(value);
        } else {
          actionResult.props[name] = [actionResult.props[name], value];
        }
      } else {
        actionResult.props[name] = value;
      }
    });

    return [actionResult, actionError];
  },
  updateAction: async function (action) {
    const updatebleFields = ["name", "type", "condition", "waitFor"];
    const fieldsToBeUpdated = Object.keys(action).filter((column) =>
      updatebleFields.includes(column),
    );

    const client = await pool.connect();
    let result = null;
    let err = null;
    try {
      await client.query("BEGIN");

      const [updatedAction, updatedActionErr] = await this.queryOne(
        `UPDATE actions SET ${fieldsToBeUpdated.map(
          (column, index) => `${snakeCase(column)} = $${index + 2}`,
        )} WHERE id = $1 RETURNING *`,
        [action.id, ...fieldsToBeUpdated.map((column) => action[column])],
        client,
      );

      if (updatedActionErr) throw updatedActionErr;

      const [, deletedActionPropsErr] = await this.queryAll(
        `DELETE FROM action_properties * WHERE action_id = $1`,
        [action.id],
        client,
      );

      if (deletedActionPropsErr) throw deletedActionPropsErr;

      const actionPropsEntries = Object.entries(action.props);
      const [actionPropsResult, actionPropsError] = await this.queryAll(
        `INSERT INTO action_properties VALUES ${actionPropsEntries
          .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
          .join(",")} RETURNING *`,
        [
          ...actionPropsEntries.flatMap(([name, value]) => [
            action.id,
            name,
            value,
          ]),
        ],
        client,
      );

      if (actionPropsError) throw actionPropsError;

      await client.query("COMMIT");

      updatedAction.props = {};
      actionPropsResult.forEach((prop) => {
        const { name, value } = prop;
        if (name in updatedAction.props) {
          if (Array.isArray(updatedAction.props[name])) {
            updatedAction.props[name].push(value);
          } else {
            updatedAction.props[name] = [updatedAction.props[name], value];
          }
        } else {
          updatedAction.props[name] = value;
        }
      });

      result = updatedAction;
    } catch (e) {
      await client.query("ROLLBACK");
      err = e;
    } finally {
      client.release();
    }

    return [result, err];
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
  getLatestSensorValuesByDeviceId: async function (deviceId) {
    const [sensors, sensorErr] = await this.getSensorsByDeviceId(deviceId);
    if (sensorErr) return [sensors, sensorErr];
    const result = {};
    for (const sensor of sensors) {
      const [{ value } = {}, valueErr] = await this.queryOne(
        "SELECT value FROM sensor_values WHERE device_id = $1 AND name = $2 ORDER BY time DESC LIMIT 1",
        [deviceId, sensor],
      );

      if (valueErr) {
        return [null, valueErr];
      }

      result[sensor] = value;
    }
    return [result, null];
  },
  getSensorValueCountByDeviceId: async function (deviceId) {
    const [sensors, sensorErr] = await this.getSensorsByDeviceId(deviceId);
    if (sensorErr) return [sensors, sensorErr];
    const result = {};
    for (const sensor of sensors) {
      const [{ value_count } = {}, valueErr] = await this.queryOne(
        "SELECT count(*) AS value_count FROM sensor_values WHERE device_id = $1 AND name = $2",
        [deviceId, sensor],
      );

      if (valueErr) {
        return [null, valueErr];
      }

      result[sensor] = Number.parseInt(value_count);
    }
    return [result, null];
  },
  getSensorTimeseries: async function (
    deviceId,
    { sensors = [], order = "DESC", offset = "1 day", aggregate = "avg" } = {},
  ) {
    let _i = 0;
    const i = () => `$${++_i}`;

    const filterBySensors = sensors.length > 0;

    const inList = (op, name, length) =>
      ` ${op} ${name} in (${new Array(length).fill(1).map(i).join(", ")})`;

    const oneOf = (value, values, fallback) =>
      values.includes(value) ? value : fallback;

    const orderEscaped = oneOf(order.toUpperCase(), ["ASC", "DESC"], "DESC");

    const aggregateEscaped = oneOf(
      aggregate.toLowerCase(),
      ["min", "max", "avg"],
      "avg",
    );

    return this.queryAll(
      `SELECT 
        time_bucket(${i()}, time) as "bucket", 
        "name", 
        ${aggregateEscaped}(sv.value) as "value"
       FROM sensor_values sv
       WHERE device_id = ${i()} ${
        filterBySensors ? inList("AND", "name", sensors.length) : ""
      }
       GROUP BY "bucket", "device_id", "name"
       ORDER BY "bucket" ${orderEscaped}`,
      [offset, deviceId, ...(filterBySensors ? sensors : [])],
    );
  },
  // SensorErrors
  createSensorError: function (sensorError) {
    return this.queryOne(
      "INSERT INTO sensor_errors VALUES ($1, $2, $3) RETURNING *",
      [sensorError.deviceId, sensorError.time, sensorError.name],
    );
  },
  getDeviceErrorCount: async function (deviceId) {
    const time = new Date();
    time.setMinutes(time.getMinutes() - 1);

    const [lastReset, lastResetError] = await this.getLastDeviceReset(deviceId);

    if (lastResetError) {
      return [null, lastResetError];
    }

    return this.queryOne(
      'SELECT count(*) FROM sensor_errors WHERE "device_id" = $1 and "time" > $2',
      [deviceId, lastReset > time ? lastReset : time],
    ).then(([res, err]) => [res?.count, err]);
  },
  getAllSensorErrors: function (deviceId, limit = 1000) {
    return this.queryAll(
      `SELECT "time", "name" FROM sensor_errors WHERE "device_id" = $1 ORDER BY "time" DESC LIMIT ${Number.parseInt(
        new String(limit),
      )}`,
      [deviceId],
    );
  },
  // DeviceResets
  createDeviceReset: function (deviceId) {
    return this.queryOne(
      "INSERT INTO device_resets VALUES ($1, $2) RETURNING *",
      [deviceId, new Date()],
    );
  },
  getLastDeviceReset: function (deviceId) {
    return this.queryOne(
      'SELECT "time" FROM device_resets WHERE "device_id" = $1 ORDER BY "time" DESC LIMIT 1',
      [deviceId],
    ).then(([res, err]) => [res?.time, err]);
  },
  getAllDeviceResets: function (deviceId, limit = 1000) {
    return this.queryAll(
      `SELECT "time" FROM device_resets WHERE "device_id" = $1 ORDER BY "time" DESC LIMIT ${Number.parseInt(
        new String(limit),
      )}`,
      [deviceId],
    ).then(([res, err]) => [res?.map((r) => r.time), err]);
  },
};

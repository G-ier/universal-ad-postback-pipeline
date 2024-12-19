// Third Party Imports
const { createClient }              = require('@clickhouse/client')

const defaultConfig = {
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  database : process.env.CLICKHOUSE_DATABASE
};

console.log("Default Config: ", defaultConfig);

class ClickhouseConnection {
  constructor() {
    if (!ClickhouseConnection.instance) {
      this.connection = createClient(defaultConfig);
      ClickhouseConnection.instance = this;
      console.log("Clickhouse Connection Initialized");
    }
    return ClickhouseConnection.instance;
  }

  getConnection() {
    return this.connection;
  }

  closeConnection() {
    const closed = this.connection.close();
    console.log("Clickhouse Connection Terminated");
    return closed
  }
}

module.exports = ClickhouseConnection;

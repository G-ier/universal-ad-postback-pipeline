// Local Application Imports
const ClickhouseConnection        = require("./connection");

class ClickhouseRepository {

  constructor() {
    this.connectionInstance = new ClickhouseConnection();
    this.connection = this.connectionInstance.getConnection();
  }

  async insert(table, values) {
    try {
      const result = await this.connection.insert({
        table: table,
        values: values,
        format: 'JSONEachRow',
      });
      return result;
    } catch (error) {
      console.error("❌ Error inserting data on Clickhouse: ", error);
      throw error;
    }
  }

}

module.exports = ClickhouseRepository;

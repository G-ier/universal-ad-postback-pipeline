const { MongoClient, ServerApiVersion } = require('mongodb');

class MongoDBClient {

  constructor() {
    this.uri = process.env.MONGODB_URI;

    this.client = new MongoClient(this.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  async connect() {
    try {
      await this.client.connect();
      await this.client.db("admin").command({ ping: 1 });
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log("Disconnected from MongoDB");
    } catch (error) {
      console.error("Disconnection error:", error);
      throw error;
    }
  }
}

// Create and freeze a single instance
module.exports = Object.freeze(new MongoDBClient());

const mongoClient = require('./MongoDBConnector');
const { ObjectId } = require('mongodb');

class MongoDBRepository {

  constructor(collectionName) {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }
    this.databaseName = process.env.MONGODB_DATABASE;
    this.collectionName = collectionName;
  }

  async getCollection() {
    await mongoClient.connect();
    return mongoClient.client.db(this.databaseName).collection(this.collectionName);
  }

  /**
   * Create a new document
   * @param {Object} data - The document to create
   * @returns {Promise<string>} The ID of the created document
   */
  async create(data) {
    try {
      console.log("Creating document in MongoDB.");
      const collection = await this.getCollection();
      const document = {
        ...data,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(document);
      return result.insertedId;
    } catch (error) {
      console.error("Error creating document in MongoDB.", error);
      throw error;
    } finally {
      await mongoClient.disconnect();
    }
  }


  /**
   * Find one document by query
   * @param {Object} query - MongoDB query
   * @param {Object} options - Query options (projection, etc.)
   * @returns {Promise<Object|null>}
   */
  async findOne(query, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.findOne(query, options);
    } finally {
      await mongoClient.disconnect();
    }
  }

  /**
   * Update a document by ID
   * @param {string} id - The document ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<boolean>} Whether the document was updated
   */
  async update(id, updateData) {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } finally {
      await mongoClient.disconnect();
    }
  }

}

const sedoRSOCPostbacksRepository = Object.freeze(new MongoDBRepository('sedo-rsoc-postbacks'));
module.exports = sedoRSOCPostbacksRepository;

// Local modules
const { interpretSedoData } = require("./utils");
const ClickhouseRepository = require("./clickhouse/repository");


exports.handler = async (event, context) => {

  console.info(`Received Event ${JSON.stringify(event)}`);

  const message = JSON.parse(event.Records[0].body);
  console.log(message)

  // 2. Process the message for storage
  const processedObject = interpretSedoData(message.event);
  console.log("Processed Object: ", processedObject);

  // 3. Store on ClickHouse
  let clickHouseRepository = new ClickhouseRepository()
  try {
    await clickHouseRepository.insert('postback_events', [processedObject]);
    console.log("Inserted event into database");
  } catch (error) {
    console.error("Error performing database operation:", error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  } finally {
    // Ensure the client is disconnected
    clickHouseRepository.connectionInstance.closeConnection();
  }

  console.debug("Done");

  return {
    statusCode: 200,
    body: "ok",
  };

};

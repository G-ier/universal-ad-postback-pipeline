// Local modules
const {
  sendRequestToFunnelFlux,
  sendRequestsToMaximizer,
  templateDispatcher
} = require("./utils");
const ClickhouseRepository = require("./clickhouse/repository");

// Constants
const sedoEventsTableInClickHouse = 'sedo_raw_events'

exports.handler = async (event, context) => {

  console.info(`Received Event ${JSON.stringify(event)}`);

  const message = JSON.parse(event.Records[0].body);

  console.log(message)

  // 1. Forward the message to 3rd party services
  try {
    const data = {
      session_id: message.event.queryStringParameters.sub3,
      transaction_id: message.event.queryStringParameters.txid,
      revenue: parseFloat(message.event.queryStringParameters.revenue) || 0,
      keyword: message.event.queryStringParameters.kwp || "",
    }
    console.debug("Sending documents to FunnelFlux", data);
    await sendRequestToFunnelFlux(data);
    console.debug("Sent documents to FunnelFlux");

    await sendRequestsToMaximizer(data);
    console.debug("Sent documents to MaxiMedia");

  } catch (e) {
    console.error(`Error sending documents to FunnelFlux: ${e.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }

  // 2. Process the message for storage
  const processedObject = templateDispatcher(message.event);
  console.log("Processed Object: ", processedObject);

  // 3. Store on PostgreSQL
  let chRepo = new ClickhouseRepository()
  try {
      await chRepo.insert(sedoEventsTableInClickHouse, [processedObject]);
      console.log("Inserted event into database");
  } catch (error) {
      console.error("Error performing database operation:", error);
      return {
          statusCode: 500,
          body: JSON.stringify(error),
      };
  } finally {
      // Ensure the client is disconnected
      chRepo.connectionInstance.closeConnection();
  }

  console.debug("Done");

  return {
      statusCode: 200,
      body: "ok",
  };

};

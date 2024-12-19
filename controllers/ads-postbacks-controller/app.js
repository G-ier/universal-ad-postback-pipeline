"use strict";

// Local modules
const {
  sendRequestsInBatchesToFunnelFlux
} = require("./utils");


exports.handler = async (event, context) => {

  console.debug("Event received", event);

  const message = JSON.parse(event.Records[0].body);

  console.log(message)

  try {
    const funnelFluxData = {
      session_id: message.event.queryStringParameters.subid3,
      transaction_id: new Date().toISOString(),
      revenue: parseFloat(message.event.queryStringParameters.revenue) || 0
    }
    console.debug("Sending documents to FunnelFlux", funnelFluxData);
    await sendRequestsInBatchesToFunnelFlux([funnelFluxData]);
    console.debug("Sent documents to FunnelFlux");
  } catch (e) {
    console.error(`Error sending documents to FunnelFlux: ${e.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }

  console.debug("Done");

  return {
    statusCode: 200,
  };
};

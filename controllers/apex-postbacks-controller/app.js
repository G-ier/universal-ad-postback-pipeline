"use strict";

// Local modules
const { parseAirfindPBData, routeToClickflare, sendToReporterSqs, parseCapiData, postApexEvent } = require("./utils");
const apexPostbacksRepository = require("./MongoDBRepository");

exports.handler = async (event, context) => {

  try {

    // Receive and log the event
    console.debug("Event received", JSON.stringify(event, null, 2));
    const message = event.Records[0].body;

    // Parse the message if it's a string
    let parsedMessage = message;
    try {
      if (typeof message === 'string') {
        parsedMessage = JSON.parse(message);
        console.debug("Message parsed successfully", parsedMessage);
      } else {
        console.debug("Message is already parsed JSON object");
      }
    } catch (error) {
      console.error("Error parsing message as JSON", error);
    }

    // Parse CAPI data
    //const capi_click_id = await parseCapiData(parsedMessage.event.rawQueryString);
    //console.debug("CAPI data", capiData);

    // Store the message on MongoDB // Function is invariant to the network --> name irrelevant
    await apexPostbacksRepository.create(parsedMessage);

    // Send the message to Clickflare
    if (process.env.ROUTE_TO_CLICKFLARE === "true") await routeToClickflare(parsedMessage);

    // Send the message to Apex
    if (process.env.ROUTE_TO_APEX === "true") await postApexEvent(pbData);

  } catch (e) {
    console.error(`Error processing postback event ${e}`);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  } finally {
    console.debug("Done");
  }

  return {
    statusCode: 200,
  };
};

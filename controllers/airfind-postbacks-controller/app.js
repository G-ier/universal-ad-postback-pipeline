"use strict";

// Local modules
const { parseAirfindPBData, routeToClickflare } = require("./utils");

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

    // Send the message to Clickflare
    await routeToClickflare(parsedMessage);

    // Store the message in our database
    // TODO: We need to decide where and how to store the message

  } catch (e) {
    console.error(`Error saving event to ClickHouse ${e}`);
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

"use strict";

// Local modules
const { parseTonicPBData } = require("./utils");
const ClickhouseRepository = require("./ClickHouseRepository");

exports.handler = async (event, context) => {

  try {
    console.debug("Event received", event);
    const message = event.Records[0].body;
    const parsedMessage = JSON.parse(message);
    const pb_data = parseTonicPBData(parsedMessage);
    const clickhouseRepository = new ClickhouseRepository();
    await clickhouseRepository.insert("postback_events: ", pb_data);
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

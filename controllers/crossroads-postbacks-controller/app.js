"use strict";

// Local modules
const { parseCrossroadsPBData } = require("./utils");
const ClickhouseRepository = require("./ClickHouseRepository");

exports.handler = async (event, context) => {

  try {
    console.info("Event received", event);
    const message = event.Records[0].body;
    const parsedMessage = JSON.parse(message);
    const pb_data = parseCrossroadsPBData(parsedMessage);
    const clickhouseRepository = new ClickhouseRepository();
    console.info("Inserting data into ClickHouse: ", [pb_data]);
    await clickhouseRepository.insert("postback_events", pb_data);
  } catch (e) {
    console.error(`Error saving event to ClickHouse ${e}`);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  } finally {
    console.info("Done");
  }

  return {
    statusCode: 200,
  };

};

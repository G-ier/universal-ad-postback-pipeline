"use strict";


exports.handler = async (event, context) => {

  try {
    console.info("Event received", event);
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

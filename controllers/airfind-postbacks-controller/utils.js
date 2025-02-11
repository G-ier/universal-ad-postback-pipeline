const moment = require('moment-timezone');

function decodeAndFormatString(encodedString) {
  try {
    // Decode the URL-encoded string
    let decodedString = decodeURIComponent(encodedString);

    // Replace '+' with spaces
    decodedString = decodedString.replace(/\+/g, ' ');

    // Return the formatted string
    return decodedString;
  } catch (error) {
    console.error(`Error while decoding and formatting string: ${encodedString}`);
    return encodedString;
  }
}

function convertDateHourToUnixTimestamp(date, hour, timeZone) {
  // Combine date and hour to create a full datetime string
  const dateTime = `${date}T${hour.toString().padStart(2, "0")}:00:00`;

  // Parse the datetime in the given time zone
  const momentObj = moment.tz(dateTime, timeZone);

  // Return the UNIX timestamp (in seconds)
  return momentObj.unix();
}

function convertUnixTimestampToUTCTimestamp(unixTimestamp, initialTimeZone) {
  // Parse the Unix timestamp (in seconds) in the given initial timezone
  const momentObj = moment.unix(unixTimestamp).tz(initialTimeZone);

  // Convert the moment object to UTC and format it
  const utcTimestamp = momentObj.utc().format('YYYY-MM-DDTHH') + ':00:00';

  return utcTimestamp;
}

function parseAirfindPBData(pb_event) {
  const insight = pb_event.event.queryStringParameters;
}

async function routeToClickflare(s2s_event) {
  console.debug("Routing to Clickflare", JSON.stringify(s2s_event, null, 2));
  const clickflare_endpoint = process.env.CLICKFLARE_ENDPOINT;
  try {
    const response = await fetch(`${clickflare_endpoint}?${decodeAndFormatString(s2s_event.event.rawQueryString)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to route to Clickflare: ${response.statusText}`);
    }
    console.log("Successfully routed to Clickflare", response);
    return true;
  } catch (error) {
    console.error("Error routing to Clickflare", error);
    return false;
  }
}

module.exports = {
  parseAirfindPBData,
  routeToClickflare
};
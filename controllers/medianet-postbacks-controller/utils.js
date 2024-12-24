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

function parseMedianetPBData(pb_event) {

  // MAPPING
  // no mapping just yet

  const insight = pb_event.event.queryStringParameters; // Starting point
  
  
  
}

module.exports = {
  parseMedianetPBData
};

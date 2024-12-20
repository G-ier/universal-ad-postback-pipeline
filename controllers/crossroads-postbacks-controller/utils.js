const moment = require('moment-timezone');

function convertDateHourToUtcTimestamp(date, hour, timeZone) {

    // Combine date and hour to create a full datetime string
    const dateTime = `${date}T${hour.toString().padStart(2, "0")}:00:00`; // Assuming the minute and second are 00
  
    // Parse the datetime in the given time zone
    const momentObj = moment.tz(dateTime, timeZone);
  
    // Convert the moment object to UTC and format it to an ISO string
    const utcTimestamp = momentObj.utc().format();
  
    // Return the ISO string without the timezone information
    return utcTimestamp.slice(0, -1);
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

function isNotNumeric(str) {
  return isNaN(parseFloat(str)) || !isFinite(str);
}

function todayYMD(timeZone = 'America/Los_Angeles') {
  return moment().tz(timeZone).format('YYYY-MM-DD');
}

function parseCrossroadsPBData(pb_event) {

  const insight = pb_event.event.queryStringParameters;
  const request_date = todayYMD();

  let [traffic_source, country_code, region, city] = insight.tg7
    ? insight.tg7.replace(" ", "").split("-")
    : ["Unknown", "Unknown", "Unknown", "Unknown"];

  let [pixel_id, timestamp] = insight.tg9 ? insight.tg9.replace(" ", "").split("-") : ["Unknown", "Unknown"];

  if (traffic_source === "taboola") {
    timestamp = insight.tg9;
    pixel_id = "";
  }

  let [campaign_id, adset_id, ad_id] = [insight.tg2, insight.tg5, insight.tg6];
  if (isNotNumeric(campaign_id)) campaign_id = `Unknown`;
  if (isNotNumeric(adset_id)) adset_id = `Unknown`;
  if (isNotNumeric(ad_id)) ad_id = `Unknown`;
  const session_id = /^[0-9a-zA-Z-]+$/.test(insight.tg3) ? insight.tg3 : "Unknown";

  if (campaign_id === `Unknown` || adset_id === `Unknown` || ad_id === `Unknown`) {
    traffic_source = "unknown";
  }

  // Decoding the campaign names.
  const campaign_name = insight.tg1 ? decodeAndFormatString(insight.tg1) : "Unknown";

  // Fallback to the date and hour if the timestamp is not valid
  const isTimestampValid = /^\d{10,13}$/.test(timestamp);
  const click_timestamp = isTimestampValid
    ? parseInt(timestamp)
    : convertDateHourToUnixTimestamp(
        request_date,
        parseInt(insight.hour) || 0,
        'America/Los_Angeles'
      );

  const date_hour = isTimestampValid ? convertUnixTimestampToUTCTimestamp(click_timestamp, 'UTC') : convertDateHourToUtcTimestamp(request_date, parseInt(insight.hour) ? parseInt(insight.hour) : 0, 'America/Los_Angeles')

  // Modify the country_code to ensure it's always 2 characters
  country_code = country_code === "Unknown" ? "XX" : country_code.substring(0, 2);

  return {
    // Timely Data
    date_hour: date_hour,
    click_timestamp: click_timestamp,

    // Crossroads Data
    network: 'crossroads',
    nw_campaign_id: "",
    nw_campaign_name: "",

    // Traffic Source Data
    pixel_id: pixel_id,
    campaign_id: campaign_id,
    campaign_name: campaign_name,
    adset_name: "",
    adset_id: adset_id,
    ad_id: ad_id,
    traffic_source: traffic_source,

    // user data
    session_id: session_id,
    ip: insight.tg4,
    country_code: country_code,
    region: region || "Unknown",
    city: city || "Unknown",
    ts_click_id: insight.tg10,
    user_agent: insight.tg8,

    event_type: insight.eventType,

    // conversion Data
    conversions: insight.eventType === 'Purchase' ? 1 : 0,
    revenue: parseFloat(insight.value) || 0,
    keyword_clicked: insight.kwp || "",
    adset_name: ""
  };
}

module.exports = {
  parseCrossroadsPBData
}
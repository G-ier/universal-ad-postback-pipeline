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

function parseTonicPBData(pb_event) {

  // MAPPING
  // subid1: user-agent
  // subid2: pixel_id_|_campaign_id_|_adset_id_|_ad_id_|_traffic_source_|_session_id
  // subid3: external
  // subid4: ip_|_country_code_|_region_|_city_|_timestamp_|_campaign_name

  const insight = pb_event.event.queryStringParameters;
  const user_agent = insight.subid1;

  // New Extracted Fields
  const subid2Matches = insight.subid2 ? insight.subid2.split("_|_") : ["Unknown", "Unknown", "Unknown", "Unknown", "unknown", "Unknown"];
  const [pixel_id, campaign_id, adset_id, ad_id, traffic_source, session_id] = subid2Matches;

  const external = insight.subid3;

  const subid4Matches = insight.subid4 ? insight.subid4.split("_|_") : ["Unknown", "Unknown", "Unknown", "Unknown", "Unknown", "Unknown"];
  const [ip, country_code, region, city, timestamp, campaign_name] = subid4Matches;

  // Decoding the campaign names.
  const ts_campaign_name = campaign_name ? decodeAndFormatString(campaign_name) : "Unknown";

  // Fallback to the date and hour if the timestamp is not valid
  const isTimestampValid = /^\d{10,13}$/.test(timestamp);
  const click_timestamp = isTimestampValid
    ? parseInt(timestamp)
    : convertDateHourToUnixTimestamp(
      insight.date,
        parseInt(hour) || 0,
        'America/Los_Angeles'
      );

  const date_hour = isTimestampValid ? convertUnixTimestampToUTCTimestamp(click_timestamp, 'UTC') : click_timestamp;

  return {

    // Timely Data
    date_hour: date_hour,
    click_timestamp: click_timestamp,

    // Tonic Data
    network: 'tonic',
    nw_campaign_id: "",
    nw_campaign_name: "",

    // Traffic Source Data
    pixel_id: pixel_id,
    campaign_id: campaign_id,
    campaign_name: ts_campaign_name,
    adset_id: adset_id,
    adset_name: "",
    ad_id: ad_id,
    traffic_source: traffic_source,

    // User Data
    session_id: session_id,
    ip: ip,
    country_code: country_code,
    region: region,
    city: city,
    ts_click_id: external,
    user_agent: user_agent,

    event_type: insight.type === 'click' ? 'Purchase': '',

    // Conversion Data
    conversions: insight.type === 'click' ? 1 : 0,
    revenue: parseFloat(insight.revenue) || 0,
    keyword_clicked: insight.kwp,
  }
}

module.exports = {
  parseTonicPBData
};

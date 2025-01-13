// Utility function that checks whether date is older than 2 days.
function isOlderThan2Days(dateUtc) {
  const now = new Date(); // Current date and time
  const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)); // Subtract 2 days worth of milliseconds
  const givenDate = new Date(dateUtc); // Convert the given UTC date to a Date object
  return givenDate < twoDaysAgo; // Returns true if the given date is older than 2 days
}

// Interprets the data from the Sedo postback and returns a formatted object for Clickhouse
const interpretSedoData = (data) => {
    const {
        domain,
        kwp,
        revenue,
        sub1,
        sub2,
        sub3,
        txid
    } = data.queryStringParameters;
  
    const received_at = new Date().getTime();

    // Handle undefined click_timestamp by using received_at
    const click_timestamp = data.requestContext.timeEpoch;
    let clickDateTime;
    if (typeof click_timestamp !== 'undefined') {
        // Clickhouse needs a timestamp in milliseconds
        clickDateTime = click_timestamp;
    } else {
        clickDateTime = received_at; // Use received_at if click_timestamp is undefined. It is by default in milliseconds
    }

    if (isOlderThan2Days(clickDateTime)) {
        console.log(`This value ${click_timestamp} converted to ${clickDateTime}??`)
        console.log(`Replaced it with ${received_at}`)
        clickDateTime = received_at;
    }
  
    let [external, session_id, traffic_source, ip, country_code] = sub1 ? sub1.split('|') : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];
    let [campaign_id, adset_id, ad_id, pixel_id] = sub2 ? sub2.split('|') : ['Unknown', 'Unknown', 'Unknown', 'Unknown'];
    let [campaign_name, timestamp, region, city] = sub3 ? (sub3).split('|') : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];

    if (!['tt', 'fb'].includes(traffic_source)) traffic_source = 'unknown';
    if(traffic_source == "fb"){
      traffic_source = "facebook";
    }
    if(traffic_source == "tt"){
      traffic_source = "tiktok";
    }

    return {
        click_timestamp: clickDateTime,
        nw_campaign_id: '',
        nw_campaign_name: domain,
        
        pixel_id: pixel_id,
        campaign_id: campaign_id,
        campaign_name: campaign_name,
        adset_id: adset_id,
        ad_id: ad_id,
        traffic_source: traffic_source,

        session_id: session_id,
        ip: ip,
        country_code: country_code,
        region: region,
        city: city,
        ts_click_id: external,
        user_agent: '',
        event_type: 'Purchase',
        conversions: 1,
        revenue: revenue ? parseFloat(revenue) : 0,
        keyword_clicked: kwp,
        network: 'sedo',
        adset_name: ''
    }

}

module.exports = {
  interpretSedoData
};

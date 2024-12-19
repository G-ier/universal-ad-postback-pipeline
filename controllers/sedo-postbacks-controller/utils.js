const https = require('https');

async function sendRequestToFunnelFlux(doc) {
  const baseURL = "https://ff.secureclks.net/pb/";
  return new Promise((resolve, reject) => {
      const url = `${baseURL}?hit=${encodeURIComponent(doc.session_id)}&tx=${encodeURIComponent(doc.transaction_id)}&rev=${encodeURIComponent(doc.revenue)}`;
      console.log(`Sending request to FunnelFlux: ${url}`);
      https.get(url, (res) => {
          const { statusCode } = res;
          if (statusCode !== 200) {
              reject(new Error(`Request Failed. Status Code: ${statusCode}`));
          }

          res.on('data', () => {}); // Consume response data to free up memory
          res.on('end', () => resolve(`Request for ${doc.id} completed with status: ${statusCode}`));
      }).on('error', (e) => {
          console.error(`Error sending request to FunnelFlux: ${e.message}`);
          reject(e);
      });
  });
}

async function sendRequestsToMaximizer(doc) {
  const url = `https://trc.fade321.com/cf/cv?click_id=${encodeURIComponent(doc.session_id)}&payout=${encodeURIComponent(doc.revenue)}&txid=${encodeURIComponent(doc.transaction_id)}&ct=search_click&param1=${encodeURIComponent(doc.keyword)}`;
  https.get(url, (res) => {
      const { statusCode } = res;
      if (statusCode !== 200) {
          reject(new Error(`Request Failed. Status Code: ${statusCode}`));
      }
      res.on('data', () => {}); // Consume response data to free up memory
      res.on('end', () => resolve(`Request for ${doc.id} completed with status: ${statusCode}`));
  }).on('error', (e) => {
      console.error(`Error sending request to Maximedia: ${e.message}`);
      reject(e);
  });
}

// Utility function that checks whether date is older than 2 days.
function isOlderThan2Days(dateUtc) {
  const now = new Date(); // Current date and time
  const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)); // Subtract 2 days worth of milliseconds
  const givenDate = new Date(dateUtc); // Convert the given UTC date to a Date object
  return givenDate < twoDaysAgo; // Returns true if the given date is older than 2 days
}

// Default Template sets the values to unknown
const defaultTemplate = (data) => {

  const {
      click_timestamp,
      domain,
      kwp,
      revenue,
      sub1,
      sub2,
      sub3,
      txid
  } = data.queryStringParameters;

  const received_at = new Date(data.requestContext.timeEpoch).toISOString();

  // Handle undefined click_timestamp by using received_at
  let clickDateTime;
  if (typeof click_timestamp !== 'undefined') {
      clickDateTime = new Date(click_timestamp * 1000).toISOString();
  } else {
      clickDateTime = received_at; // Use received_at if click_timestamp is undefined
  }

  if (isOlderThan2Days(clickDateTime)) {
      console.log(`This value ${click_timestamp} converted to ${clickDateTime}??`)
      console.log(`Replace it with ${received_at}`)
      clickDateTime = received_at;
  }

  return {
      transaction_id: txid,
      click_timestamp: clickDateTime,
      received_at,
      campaign_id: "Unknown",
      campaign_name: "Unknown",
      pixel_id: "Unknown",
      adset_id: "Unknown",
      adset_name: "Unknown",
      ad_id: "Unknown",
      traffic_source: "unknown",
      network: "sedo",
      parsing_template: null,
      domain,
      keyword_clicked: kwp,
      revenue: revenue ? parseFloat(revenue) : 0
  };
}

// Parameters interperting Template V.1
const templateV1 = (data) => {

  const {
      click_timestamp,
      domain,
      kwp,
      revenue,
      sub1,
      sub2,
      sub3,
      txid
  } = data.queryStringParameters;

  const received_at = new Date(data.requestContext.timeEpoch).toISOString();

  // Handle undefined click_timestamp by using received_at
  let clickDateTime;
  if (typeof click_timestamp !== 'undefined') {
      clickDateTime = new Date(click_timestamp * 1000).toISOString();
  } else {
      clickDateTime = received_at; // Use received_at if click_timestamp is undefined
  }

  if (isOlderThan2Days(clickDateTime)) {
      console.log(`This value ${click_timestamp} converted to ${clickDateTime}??`)
      console.log(`Replaced it with ${received_at}`)
      clickDateTime = received_at;
  }

  // Regex patterns
  const sub2Pattern = /^\d+\|\d+\|\d+\|[a-zA-Z]+$/

  // Attempt to match and extract; set to 'Unknown' if no match
  const sub2Matches = sub2Pattern.test(sub2) ? sub2.split('|') : ['Unknown', 'Unknown', 'Unknown', 'unknown'];

  const [campaign_id, adset_id, ad_id, traffic_source] = sub2Matches;

  const processedObject =  {
      transaction_id: txid,
      click_timestamp: clickDateTime,
      received_at,
      campaign_id,
      campaign_name: "",
      pixel_id: "",
      adset_id,
      adset_name: "",
      ad_id,
      traffic_source,
      network: "sedo",
      parsing_template: sub3,
      domain,
      keyword_clicked: kwp,
      revenue: revenue ? parseFloat(revenue) : 0
  };

  return processedObject;
}

// Dispatches the data to it's appropriate template.
const templateDispatcher = (data) => {

  // Extract the template labeled query
  const sub2Pattern = /^\d+\|\d+\|\d+\|[a-zA-Z]+$/
  const { sub2 } = data.queryStringParameters;

  // Attempt to match and extract; set to 'Unknown' if no match
  const sub2Matches = sub2Pattern.test(sub2) ? sub2.split('|') : ['Unknown', 'Unknown', 'Unknown', 'unknown'];
  const [campaign_id, adset_id, ad_id, traffic_source] = sub2Matches;

  // Check if the insight has a template and route to the appropriate function
  const template = campaign_id !== 'Unknown' ? 'temp_v1' : "Undefined"
  if (template === "Undefined") return defaultTemplate(data)
  else {
      if (template.includes('v1')) return templateV1(data)
      else return defaultTemplate(data)
  }

};


module.exports = {
  sendRequestToFunnelFlux,
  sendRequestsToMaximizer,
  templateDispatcher
};

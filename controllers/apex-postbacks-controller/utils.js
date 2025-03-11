const { FB_API_URL, FB_TOKEN, FB_PIXEL } = require('./fbConstants');
const { usStates } = require('./usStates');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

async function parseAirfindPBData(pb_event) {
  const insight = pb_event.event.rawQueryString;
  const urlSearchParams = new URLSearchParams(insight);
  const insightObject = Object.fromEntries(urlSearchParams.entries());
  return insightObject;
}

async function routeToClickflare(s2s_event) {
  console.debug(`Routing to Clickflare [${s2s_event.event.requestContext.http.method}]`, JSON.stringify(s2s_event, null, 2));
  const clickflare_endpoint = process.env.CLICKFLARE_ENDPOINT;
  try {
    const response = await fetch(`${clickflare_endpoint}?${s2s_event.event.rawQueryString}`, {
      method: s2s_event.event.requestContext.http.method,
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

/**
     * Posts conversion events to Facebook's Conversion API
     * @param {string} token - The Facebook access token
     * @param {string} pixel - The Facebook pixel ID
     * @param {Object} data - The event data to send
     * @param {Array} data.data - Array of event objects
     * @returns {Promise<Object>} The Facebook API response
     * @throws {Error} If the API request fails
     */
async function postCapiEvents(data) {
  console.debug(`Sending ${data.length} events to Facebook CAPI for pixel ${FB_PIXEL}`);
  console.debug(`Checking API URL: ${FB_API_URL}/${FB_PIXEL}/events`);
  console.debug(`Checking data: ${JSON.stringify(data, null, 2)}`);
  const url = `${FB_API_URL}/${FB_PIXEL}/events`;

  const payload = await constructEventForFacebook(data, "apex");
  
  try {
    const response = await axios.post(
      url, 
      {
        data: payload,
        access_token: `${FB_TOKEN}`,
      }, 
      { 
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error posting events to Facebook CAPI: ${error}`);
    throw error;
  }
}

/**
 * Constructs Facebook conversion events payloads.
 * @param {Object} event - Single conversion object
 * @param {string} network - Network type ('tonic' or 'crossroads')
 * @returns {Object} Facebook events payload
 */
async function constructEventForFacebook(event, network) {
  const data = [];

  // Generate identifiers
  const fbc = `fb.1.${event.click_timestamp * 1000}.${event.ts_click_id}`; 
  const fbp = `fb.1.${event.click_timestamp * 1000}.${generateEventId()}`;

  // Transform state
  const state = transformState(event);

  // Create common user data
  const userData = createUserData(event, fbc, fbp, state);

  // Add 'Page View' payloads
  for (let i = 0; i < event.lander_visitors; i++) {
    const pageViewPayload = createPayload(
        "Page View",
        event,
        userData,
        {},
        i
    );
    data.push(pageViewPayload);
}

// Add 'View content' payloads
for (let i = 0; i < event.lander_searches; i++) {
    const viewContentPayload = createPayload(
        "View content",
        event,
        userData,
        { content_name: event.keyword_clicked },
        i
    );
    data.push(viewContentPayload);
}

  // Add 'Purchase' payloads
  for (let i = 0; i < event.conversions; i++) {
      const purchasePayload = createPayload(
          "Purchase",
          event,
          userData,
          {
              currency: "USD",
              value: `${event.revenue / event.conversions}`,
              content_name: event.keyword_clicked,
          },
          i
      );
      data.push(purchasePayload);
  }

  return { data };
}

/**
 * Creates a payload for an event.
 * @param {string} eventName - Name of the event ('Page View', 'View content', 'Purchase')
 * @param {Object} event - The event object
 * @param {Object} userData - User data object
 * @param {Object} customDataOverrides - Overrides for custom data
 * @param {number} iteration - Iteration index for event_id uniqueness
 * @returns {Object} Event payload
 */
function createPayload(eventName, event, userData, customDataOverrides, iteration) {
  return {
      event_name: eventName,
      event_time: Number(event.click_timestamp),
      event_id: `${event.ts_click_id}-${iteration}-${generateEventId()}`,
      action_source: "website",
      user_data: userData,
      opt_out: false,
      custom_data: {
          content_type: event.vertical,
          content_category: event.category,
          ...customDataOverrides,
      },
  };
}

/**
 * Creates user data for the payload.
 * @param {Object} event - The event object
 * @param {string} fbc - Facebook click ID
 * @param {string} fbp - Facebook browser ID
 * @param {string} state - Transformed state
 * @returns {Object} User data object
 */
function createUserData(event, fbc, fbp, state) {
  return {
      country: [sha256(event.country_code.toLowerCase())],
      client_ip_address: event.ip,
      client_user_agent: event.user_agent,
      ct: [sha256(event.city.toLowerCase().replace(" ", ""))],
      fbc: fbc,
      fbp: fbp,
      st: [sha256(state)],
  };
}

/**
 * Transforms the state information.
 * @param {Object} event - The event object
 * @returns {string} Transformed state
 */
function transformState(event) {
  if (event.country_code === "US") {
      const region = camelCaseToSpaced(event.region).toUpperCase();
      const usState = usStates[region];
      if (usState) {
          return usState.toLowerCase();
      }
  }
  return event.region.toLowerCase().replace(" ", "");
}

/**
 * Generates a unique event ID using UUID v4
 * @returns {string} A unique UUID v4 string
 */
function generateEventId() {
  return uuidv4();
}

async function parseCapiData(rawQueryString) {
  const urlSearchParams = new URLSearchParams(rawQueryString);
  const capiData = Object.fromEntries(urlSearchParams.entries());
  return capiData;
}

function camelCaseToSpaced(str) {
    try {
        // Split string at capital letters and join with space
        const result = str.replace(/([A-Z])/g, ' $1').trim();
        return result;
    } catch (error) {
        console.error('Error converting camelCase to spaced string:', error);
        throw error;
    }
}

module.exports = {
  parseAirfindPBData,
  routeToClickflare,
  postCapiEvents,
  parseCapiData,
  constructEventsForFacebook
};
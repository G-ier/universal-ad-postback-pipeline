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

async function parseAirfindPBData(pb_event) {
  const insight = pb_event.event.rawQueryString;
  const urlSearchParams = new URLSearchParams(insight);
  const insightObject = Object.fromEntries(urlSearchParams.entries());
  return insightObject;
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
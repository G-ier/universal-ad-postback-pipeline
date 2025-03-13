async function parseAirfindPBData(pb_event) {
  const insight = pb_event.event.rawQueryString;
  const urlSearchParams = new URLSearchParams(insight);
  const insightObject = Object.fromEntries(urlSearchParams.entries());
  return insightObject;
}

module.exports = {
  parseAirfindPBData
};
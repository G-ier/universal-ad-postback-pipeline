const { FB_API_URL, FB_TOKEN, FB_PIXEL } = require('./fbConstants');
const { usStates } = require('./usStates');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const reporterSqsQueueUrl = "https://sqs.us-east-1.amazonaws.com/033156084586/report-conversions-queue";
const apexmongoSqsQueueUrl = "https://sqs.us-east-1.amazonaws.com/033156084586/report-conversions-queue";


const sendToReporterSqs = async (event, efclid) => {
  // Add metadata to the event
  event.received_at = new Date().toISOString();
  event.efclid = efclid;

  // Prepare the SQS message payload
  const sqsInput = {
    QueueUrl: reporterSqsQueueUrl,
    MessageBody: JSON.stringify(event),
  };

  console.debug("Sending to SQS:", JSON.stringify(sqsInput, null, 2));

  try {
    const data = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.log(`Sent to SQS: ${data.$metadata.httpStatusCode}`);
  } catch (error) {
    console.error(`Error pushing to SQS: ${error}`);
  }
};

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


async function parseCapiData(rawQueryString) {
  const urlSearchParams = new URLSearchParams(rawQueryString);
  const capiData = Object.fromEntries(urlSearchParams.entries());
  if (!capiData.clickid) {
    console.error("No clickid found in CAPI data", capiData);
    throw new Error("No clickid found in CAPI data");
  }
  return capiData.clickid;
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

const postApexEvent = async (event, efclid) => {
  
  // custom function to post to apex

  throw new Error("Not implemented");

};

module.exports = {
  parseAirfindPBData,
  routeToClickflare,
  parseCapiData,
  camelCaseToSpaced,
  postApexEvent,
  sendToReporterSqs
};
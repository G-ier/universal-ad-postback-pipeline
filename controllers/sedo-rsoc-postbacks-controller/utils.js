
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const reporterSqsQueueUrl = "https://sqs.us-east-1.amazonaws.com/033156084586/report-conversions-queue";


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
  camelCaseToSpaced,
  sendToReporterSqs
};
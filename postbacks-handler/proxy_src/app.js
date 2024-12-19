"use strict";

const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "us-east-1" });

const SqsQueueUrl = process.env.POSTBACKS_QUEUE_URL;

exports.handler = async (event) => {
  const { rawPath } = event;

  const isGET = event.requestContext.http.method && event.requestContext.http.method === "GET";

  await sendToSqs(rawPath, event, isGET);
};

const sendToSqs = async (rawPath, event, isGET = false) => {
  rawPath = rawPath.replace("/", "");
  console.debug("Raw Path: ", rawPath);

  const messageToSend = {
    network: rawPath,
    is_get: isGET,
    event,
  };
  const sqsInput = {
    MessageBody: JSON.stringify(messageToSend),
    QueueUrl: SqsQueueUrl,
  };

  // console.debug("MessageBody: ", JSON.stringify(messageToSend));

  const response = await sqsClient.send(new SendMessageCommand(sqsInput));
  console.debug("SQS Response: ", response.$metadata.httpStatusCode);

  return {
    statusCode: 200,
    body: "ok",
  };
};

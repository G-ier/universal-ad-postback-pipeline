"use strict";

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({ region: "us-east-1" });

const { SQSClient, DeleteMessageCommand, SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "us-east-1" });

const bucket = process.env.RAW_BUCKET_NAME || "raw-postback-events";

const SqsQueueUrl = process.env.POSTBACKS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/partners-postback-events";
const SedoSQSQueueUrl = process.env.SEDO_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/sedo-postbacks-queue";
const TonicSQSQueueUrl = process.env.TONIC_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/tonic-postbacks-queue"
const AdsSQSQueueUrl = process.env.ADS_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/ads-postbacks-queue"
const LunardQueueUrl = process.env.LUNARD_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/lunard-postbacks-queue"
const CrossroadsQueueUrl = process.env.CROSSROADS_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/crossroads-postbacks-queue"
const AirfindQueueUrl = process.env.AIRFIND_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/airfind-postbacks-queue"
const ApexQueueUrl = process.env.APEX_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/apex-postbacks-queue"
const SedoRSOCSQSQueueUrl = process.env.SEDO_RSOC_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/033156084586/sedo-rsoc-postbacks-queue"
exports.handler = async (event) => {
  
  console.debug("Event: ", event);
  const message = JSON.parse(event.Records[0].body);

  const isGET = message.is_get;
  console.debug("isGET: ", isGET);

  const network = await assignNetwork(message.network);
  console.debug("Network: ", network);
  const receiptHandle = event.Records[0].receiptHandle;

  // Add current timestamp to the request
  message.received_at = new Date().getTime().toString();

  // Add the request type to the request
  message.event_network = network;
  message.is_postback = "1";

  // delete some fields from the event
  delete message.md5OfBody;
  delete message.eventSource;
  delete message.eventSourceARN;
  delete message.awsRegion;
  delete message.attributes;
  delete message.network;

  console.debug("S3 Input: ", message);
  // write request to S3
  const key = new Date().toISOString().split("T")[0].replace(/-/g, "/") + "/" + Date.now() + ".json";
  const input = {
    Bucket: bucket,
    Key: network + "/" + key,
    Body: JSON.stringify(message),
  };

  const response = await s3Client.send(new PutObjectCommand(input));

  console.debug("S3 Response: ", response.$metadata.httpStatusCode);

  await deleteMessage(receiptHandle);

  if (message.event_network === 'sedo') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: SedoSQSQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode);
  }

  if (message.event_network === 'tonic') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: TonicSQSQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode);
  }

  if (message.event_network === 'ads') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: AdsSQSQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode);
  }

  if (message.event_network === 'lunard') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: LunardQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode);
  }

  if (message.event_network === 'crossroads') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: CrossroadsQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode);
  }

  if (message.event_network === 'airfind') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: AirfindQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode);
  }

  if (message.event_network === 'apex') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: ApexQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode);
  }

  if (message.event_network === 'sedorsoc') {
    // Push the message to a queue.
    const sqsInput = {
      QueueUrl: SedoRSOCSQSQueueUrl,
      MessageBody: JSON.stringify(message),
    };
    const response = await sqsClient.send(new SendMessageCommand(sqsInput));
    console.debug("SQS Response: ", response.$metadata.httpStatusCode); 
  }

};

async function assignNetwork(networkCode) {
  
  const networkCodeMap = {
    efsdv1: "sedo",
    efmnv1: "medianet",
    eftnv1: "tonic",
    efepcv1: "epcvip",
    efadsv1: "ads",
    efobmv1: "obmedia",
    efyuv1: "lunard",
    efafv1: "airfind",
    efapv1: "apex",
    efsrv1: "sedorsoc"
  };

  if (networkCode.startsWith("efdav")) {
    return "crossroads";
  }

  return networkCodeMap[networkCode];
}

async function deleteMessage(receiptHandle) {
  const sqsInput = {
    QueueUrl: SqsQueueUrl,
    ReceiptHandle: receiptHandle,
  };

  await sqsClient.send(new DeleteMessageCommand(sqsInput));
}

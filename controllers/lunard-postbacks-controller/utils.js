const https = require('https');


async function sendRequestToFunnelFlux(doc) {
  const baseURL = "https://ff.secureclks.net/pb/";
  return new Promise((resolve, reject) => {
      const url = `${baseURL}?hit=${encodeURIComponent(doc.clickId)}&tx=${encodeURIComponent(doc.transaction_id)}&rev=${encodeURIComponent(doc.revenue)}`;
      console.log(`Sending request to FunnelFlux: ${url}`);
      https.get(url, (res) => {
          const { statusCode } = res;
          if (statusCode !== 200) {
              reject(new Error(`Request Failed. Status Code: ${statusCode}`));
          }

          res.on('data', () => {}); // Consume response data to free up memory
          res.on('end', () => {resolve(`Request for ${doc.id} completed with status: ${statusCode}`);console.debug("Request processed successfully.")});
      }).on('error', (e) => {
          console.error(`Error sending request to FunnelFlux: ${e.message}`);
          reject(e);
      });
  });
}

async function sendRequestsInBatchesToFunnelFlux(documents, batchSize=10) {
    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await Promise.all(batch.map(doc => sendRequestToFunnelFlux(doc).catch(e => e)));
    }
}


module.exports = {
  sendRequestsInBatchesToFunnelFlux
};

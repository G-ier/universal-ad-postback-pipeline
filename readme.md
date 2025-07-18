## Universal Ad Postback Pipeline
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-%E2%98%95%EF%B8%8F-ffdd00?style=flat-square)](https://buymeacoffee.com/gier) [![System Status](https://img.shields.io/badge/Status-Online-green?style=flat-square&logo=checkmarx&logoColor=white)]()

### Introduction
A **production-grade Universal Ad Postback Pipeline** is a collection of serverless micro-services that capture post-conversion web-hooks ("postbacks") from multiple ad networks—**Sedo, Tonic, Crossroads, MediaNet, Airfind, Apex**, and more—then normalise and stream them into high-performance analytics stores such as **MongoDB**.

* 🛰  Built with **AWS Lambda**, **API Gateway**, **SQS**, and **SAM** for effortless scalability and low cost.
* ⚙️  Each network lives in its own *controller* (see `controllers/*`) so you can deploy, update, or roll back sources independently.
* 🚀  End-to-end latency is measured in **milliseconds**, enabling near-real-time reporting for growth and BI teams.

---

### Setup
1. **Prerequisites**
   - Node.js **18 LTS** (or higher)
   - Docker (for local Lambda execution)
   - AWS CLI + AWS SAM CLI
   - An AWS account with permission to create Lambda, API Gateway, SQS, S3, IAM, and CloudWatch resources

2. **Clone & install**
```bash
# Clone
 git clone https://github.com/your-org/universal-ad-postback-pipeline.git
 cd universal-ad-postback-pipeline

# Install NPM dependencies for every Lambda (one-liner)
 find . -name "package.json" -maxdepth 3 -execdir npm ci \;
```

3. **Secrets configuration**
The following files contain secrets that need to be updated before deploying:

   **Makefile Configuration Variables:**
   - `postbacks-handler/Makefile`: Set `AWS_ACCOUNT_ID` and `NEW_RELIC_ACCOUNT_ID`
   - `controllers/ads-postbacks-controller/Makefile`: Set `AWS_ACCOUNT_ID`
   - All controller Makefiles: Set `AWS_ACCOUNT_ID` for your AWS account

   **MongoDB Connection Strings:**
   - `controllers/apex-postbacks-controller/template.yaml`: Set `MONGODB_URI` and `MONGODB_DATABASE`
   - `controllers/airfind-postbacks-controller/template.yaml`: Set `MONGODB_URI` and `MONGODB_DATABASE`
   - `controllers/sedo-rsoc-postbacks-controller/template.yaml`: Set `MONGODB_URI` and `MONGODB_DATABASE`

   **ClickHouse Connection URLs:**
   - `controllers/crossroads-postbacks-controller/ClickHouseConnection.js`: Update hardcoded ClickHouse URL
   - `controllers/tonic-postbacks-controller/ClickHouseConnection.js`: Update hardcoded ClickHouse URL
   - `controllers/medianet-postbacks-controller/ClickHouseConnection.js`: Update hardcoded ClickHouse URL
   - `controllers/sedo-postbacks-controller/template.yaml`: Set `MONGO_URL` (marked as **MONGO_URL**)

   **API Gateway & Infrastructure:**
   - `postbacks-handler/template.yaml`: Update certificate ARN and domain name for your environment
   - `postbacks-handler/handler_src/app.js`: Update hardcoded AWS account ID in SQS queue URLs

   **Facebook Integration:**
   - `controllers/apex-postbacks-controller/template.yaml`: Set `FB_TOKEN` for Facebook API integration
   - `controllers/apex-postbacks-controller/utils.js`: Update hardcoded SQS queue URLs with your account ID

   **Environment Variables:**
   - `controllers/sedo-postbacks-controller/clickhouse/connection.js`: Set `CLICKHOUSE_URL` environment variable
   
   You can also override template parameters at deploy-time using `--parameter-overrides`.

---

### Infrastructure Deployment
> All stacks are defined with AWS SAM. A convenience **Makefile** sits inside every service directory.

Deploy a single controller (example: **Sedo**):
```bash
cd controllers/sedo-postbacks-controller
make deploy-stack           # sam deploy — no prompts
```
Tail its logs:
```bash
make tail-logs
```

Remove the stack:
```bash
make destroy-stack
```

#### Deploy the unified API proxy
The folder `postbacks-handler/` exposes a single HTTP API and fans-out incoming postbacks to SQS queues for each network.
```bash
cd postbacks-handler
make deploy-stack
```
This creates:
* API Gateway (custom domain `example.com`)
* SQS queue `raw-postback-events`
* Proxy Lambda → queue fan-out
* S3 data-lake bucket for raw logs

---

### Integration of a New Postback Source
1. **Bootstrap**: copy one of the existing controllers and rename it `<network>-postbacks-controller`.
2. **Transform**: implement `interpret<Network>Data()` inside `utils.js` to map the incoming query-string to the canonical schema (see [`interpretSedoData`](controllers/sedo-postbacks-controller/utils.js) for reference).
3. **Storage**: choose **ClickHouse** (`ClickHouseRepository.js`) or **MongoDB** (`MongoDBRepository.js`).
4. **Routing**: add a route in `postbacks-handler/proxy_src/app.js` so the API Gateway forwards `/<your-path>` to the new SQS queue.
5. **Deploy**: run `make deploy-stack` in your new controller directory.

> 💡 Hot-reloading locally: `make run-local` spins up a Dockerised Lambda with the example event under `events/event.json` so you can iterate quickly.

---

### Support & Donations

Maintaining open-source infrastructure takes time ❤️. If this project saves you hours (or dollars), please consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/☕️%20Buy%20me%20a%20coffee-EF5B25?logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/gier)

Thank you for your support!

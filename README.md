# Book a ClubSpark venue session through AWS Lambda

Book a **ClubSpark** venue session using a simple AWS Lambda function.
The function makes the needed ClubSpark API calls to perform a full booking.
Finally **automate the execution** using a trigger like **Amazon EventrBridge** (cron schedule).

---

## Setup instructions

1. Clone repository and run `npm install`
2. ZIP contents of the folder (not the folder itself)
3. Create an AWS Lambda function
   - Select 'Author from scratch', enter your function name and select Node.js 12.x.
   - Choose an existing role or create a new one and make sure it has the `AWSLambdaBasicExecutionRole` policy.
   - Upload the ZIP file.
   - Increase timeout from 3 sec to 2 min.
   - Set environment variables using the set-env npm command in package.json (see table below).
   - Configure a trigger. For instance, Amazon EventBridge, you can set up a cron schedule.

## Environment variables

| Variable          | Description                 |
| ----------------- | --------------------------- |
| ACCOUNT_1_EMAIL   | Email for the account 1.    |
| ACCOUNT_1_PASS    | Password for the account 1  |
| ACCOUNT_2_EMAIL   | Email for the account 2.    |
| ACCOUNT_2_PASS    | Password for the account 2  |

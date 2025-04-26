# HawkEye

A comprehensive AWS infrastructure monitoring and analysis platform consisting of multiple microservices. It uses [masumi](https://www.masumi.network/) for payments.

![](https://raw.githubusercontent.com/subhamX/hawkeye/refs/heads/main/visualize-americano/public/main.png)

## Project Structure

- `agent-expresso/`: Python-based agent service for AWS infrastructure analysis
- `payments-latte/`: Node.js-based payment processing service
- `visualize-americano/`: Visualization service for infrastructure data


## Registering your agent

```bash
export MASUMI_PAYMENTS_SERVICE_ADMIN_KEY='abcdef_this_should_be_very_secure'
export SELLING_WALLET_VKEY=xxxx
```

```bash
curl -X 'POST' \
  'https://payment.masumi.network/api/v1/registry/' \
  -H 'accept: application/json' \
  -H "token: $MASUMI_PAYMENTS_SERVICE_ADMIN_KEY" \
  -H 'Content-Type: application/json' \
  -d '''{
  "network": "Preprod",
  "ExampleOutputs": [],
  "Tags": [
    "tag1",
    "tag2"
  ],
  "name": "AWS HawkEye",
  "description": "Get comprehensive insights into your AWS infrastructure with our intelligent agents",
  "Author": {
    "name": "subhamx",
    "contactEmail": "author@example.com",
    "contactOther": "author_contact_other",
    "organization": "AWS"
  },
  "apiBaseUrl": "https://aws-hawkeye.vercel.app/docs/",
  "Legal": {
    "privacyPolicy": "xxx",
    "terms": "xxx",
    "other": "xxx"
  },
  "sellingWalletVkey": "'"$SELLING_WALLET_VKEY"'",
  "Capability": {
    "name": "Analyze EC2, S3, and CloudFormation resources for security, performance, and cost optimization.",
    "version": "1.0.0"
  },
  "AgentPricing": {
    "pricingType": "Fixed",
    "Pricing": [
      {
        "unit": "lovelace",
        "amount": "10000000"
      }
    ]
  }
}'
```
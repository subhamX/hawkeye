# HawkEye


## Running agent-expresso


```bash
cd agent-expresso/
pyenv install 3.12
pyenv global  3.12 

[ -d .venv ] || python -m venv .venv
source ./.venv/bin/activate
python --version

pip install -r requirements.txt
uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000}
```


```
uvx --with 'boto3==1.38.2' mypy-boto3-builder
```

## Running the payments service

```bash
cd payments-latte/

npm install
npm run prisma:migrate
npm run prisma:seed

# optional
# git fetch --tags      
# git checkout $(git tag -l | sort -V | tail -n 1)


cd frontend/
npm install
npm run build

cd ..

npm run build && npm start
```


## Registering

```bash
export MASUMI_PAYMENTS_SERVICE_ADMIN_KEY='abcdef_this_should_be_very_secure'
```


### Get some info

```bash
curl -X 'GET' \
  'http://localhost:3001/api/v1/payment-source/?take=10' \
  -H 'accept: application/json' \
  -H "token: $MASUMI_PAYMENTS_SERVICE_ADMIN_KEY"
```

```bash
export WALLET_VKEY_SELLING='37a8afce157cacd2cd26d562707aaa38c415499ad5d0ddda8585ba44'
# the following is not required?
export SMART_CONTRACT_ADDRESS='addr_test1wrsr3luhqv0ftxjc6yrafw0tfesvtecrpck0s83arm0ttfqq77nu3'
```

```bash
curl -X 'POST' \
  'https://payment.masumi.network/api/v1/registry/' \
  -H 'accept: application/json' \
  -H "token: iofsnaiojdoiewqajdriknjonasfoinasd" \
  -H 'Content-Type: application/json' \
  -d '{
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
    "privacyPolicy": "Privacy Policy URL",
    "terms": "Terms of Service URL",
    "other": "Other Legal Information URL"
  },
  "sellingWalletVkey": "f9455f8373a0f538b62202ef6ebca46018874330a9ab8e0278cfcfee",
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
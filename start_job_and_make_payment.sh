#!/bin/bash

# A lot of the creds are hardcoded as this is for adhoc testing.. NO REAL MONEY IS INVOLVED.. DON'T BE TEMPTED TO TRY 
# AND GET THIS FAKE MONEY.. Believe me, it's not worth it. 
# Instead get it from the cardano faucet!


echo "🚀 Starting job and payment process..."
echo "----------------------------------------"

output=$(curl -X 'POST' \
  'http://localhost:8000/start_job' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "identifier_from_purchaser": "example_purchaser",
  "input_data": {
    "aws_account_id": "621947758064",
    "work_scope": "Do not check for anything in Route53 and Kinesis please."
  }
}')

echo "✅ Job started successfully!"
echo "----------------------------------------"

# output is like: {"status":"success","job_id":"5cd4a2e5-6fa3-425e-b3cf-fcc3f61b730f","blockchainIdentifier":"eyJkYXRhIjoie1wiaW5wdXRIYXNoXCI6XCIwYzA3Y2UzOWYxYjk4MzQwNDY1MDU2NTZmZDk5ZDM1ODY3NGNjOTZkNDNiNjJlZGVmNDIzYzk1ZDQ5ODA5MTgzXCIsXCJhZ2VudElkZW50aWZpZXJcIjpcIjBjMjkxMmQ0MDg4ZmJjNmEwYzcyNWRiZTUyMzM3MzU4MjExMDliZDc0MWFjZmE5ZjEzOTAyMzAyZTQzY2FhNDliNjBjMzAxOWQ1NDZiNDA2MjMwMmEwOWVhOGEwNmI1OTk5ZGFmOGFmYTM5ODczNDAyNDA1NDFjOVwiLFwicHVyY2hhc2VySWRlbnRpZmllclwiOlwiZXhhbXBsZV9wdXJjaGFzZXJcIixcInNlbGxlckFkZHJlc3NcIjpcImFkZHJfdGVzdDFxcnU1Mmh1cnd3czAydzlreWdwdzdtNHU1M3NwM3A2cnh6NTZocnN6MHI4dWxtam11ajY2eXFqbmU0enJqanpwa3VtZThqMG1tdWd1ZzhqMmR1d2N4cmx6NWZmcW1kc3B2NFwiLFwic2VsbGVySWRlbnRpZmllclwiOlwib3c2ZzdldzR2ZmU4MXJyMXJhdWRzcGx6XCIsXCJSZXF1ZXN0ZWRGdW5kc1wiOlt7XCJhbW91bnRcIjpcIjEwMDAwMDAwXCIsXCJ1bml0XCI6XCJcIn1dLFwic3VibWl0UmVzdWx0VGltZVwiOlwiMTc0NTcxNjU4NTIzMlwiLFwidW5sb2NrVGltZVwiOlwiMTc0NTczODE4NTIzMlwiLFwiZXh0ZXJuYWxEaXNwdXRlVW5sb2NrVGltZVwiOlwiMTc0NTc1OTc4NTIzMlwifSIsInNpZ25hdHVyZSI6Ijg0NTg2OWEzMDEyNzA0NTgyMDI0MzBmMTFkOWQ0ODZhMzc3ZDVkZjljNDEwNjc2YzIxMGM1YjE5MmQ1ZDEzNmNkYjVlMGM0OWU5Y2EwNWIyYjY2NzYxNjQ2NDcyNjU3MzczNTgzOTAwZjk0NTVmODM3M2EwZjUzOGI2MjIwMmVmNmViY2E0NjAxODg3NDMzMGE5YWI4ZTAyNzhjZmNmZWU1YmU0YjVhMjAyNTNjZDQ0Mzk0ODQxYjczNzkzYzlmYmRmMTFjNDFlNGE2ZjFkODMwZmUyYTI1MmExNjY2ODYxNzM2ODY1NjRmNDQwNTg0MDlmZGMzMzAzYjQ3NjNmYzY3ZGMzNGI2N2YyZTcwZGI3ODc5NGE1Y2FiN2IxODA3Yjg4N2JkMzhhMWE1NDQwNDMzNzIzY2NmMDliMjY3YjBlN2ZiYmFlNWUwOTE4OTFmODBiYjc0OTlmMWRmZDViZWRmMzMyYjdkYTMzNzM3MDBkIiwia2V5IjoiYTQwMTAxMDMyNzA2MjEyMTU4MjAyNDMwZjExZDlkNDg2YTM3N2Q1ZGY5YzQxMDY3NmMyMTBjNWIxOTJkNWQxMzZjZGI1ZTBjNDllOWNhMDViMmI2In0=","submitResultTime":"1745716585232","unlockTime":"1745738185232","externalDisputeUnlockTime":"1745759785232","agentIdentifier":"0c2912d4088fbc6a0c725dbe5233735821109bd741acfa9f13902302e43caa49b60c3019d546b4062302a09ea8a06b5999daf8afa3987340240541c9","sellerVkey":"f9455f8373a0f538b62202ef6ebca46018874330a9ab8e0278cfcfee","identifierFromPurchaser":"example_purchaser","amounts":[{"amount":"10000000","unit":"lovelace"}],"input_hash":"0c07ce39f1b9834046505656fd99d358674cc96d43b62edef423c95d49809183"}


identifierFromPurchaser=$(echo "$output" | jq -r '.identifierFromPurchaser')
blockchainIdentifier=$(echo "$output" | jq -r '.blockchainIdentifier')
sellerVkey=$(echo "$output" | jq -r '.sellerVkey')
agentIdentifier=$(echo "$output" | jq -r '.agentIdentifier')
inputHash=$(echo "$output" | jq -r '.input_hash')

unlockTime=$(echo "$output" | jq -r '.unlockTime')
submitResultTime=$(echo "$output" | jq -r '.submitResultTime')
externalDisputeUnlockTime=$(echo "$output" | jq -r '.externalDisputeUnlockTime')

curl -X 'POST' \
  'https://payment.masumi.network/api/v1/purchase/' \
  -H 'accept: application/json' \
  -H 'token: iofsnaiojdoiewqajdriknjonasfoinasd' \
  -H 'Content-Type: application/json' \
  -d '{
  "identifierFromPurchaser": "'$identifierFromPurchaser'",
  "blockchainIdentifier": "'$blockchainIdentifier'",
  "network": "Preprod",
  "sellerVkey": "'$sellerVkey'",
  "paymentType": "Web3CardanoV1",
  "submitResultTime": "'$submitResultTime'",
  "unlockTime": "'$unlockTime'",
  "externalDisputeUnlockTime": "'$externalDisputeUnlockTime'",
  "agentIdentifier": "'$agentIdentifier'",
  "inputHash": "'$inputHash'"
}'

echo "✅ Payment request submitted!"
echo "----------------------------------------"

job_id=$(echo "$output" | jq -r '.job_id')
echo "📋 Job Details:"
echo "   Job ID: $job_id"
echo "   Purchaser: $identifierFromPurchaser"
echo "   Network: Preprod"
echo "   Payment Type: Web3CardanoV1"
echo "----------------------------------------"
echo "✨ Process completed successfully!"
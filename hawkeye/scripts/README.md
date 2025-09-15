# HawkEye Analysis Scripts

## Heimdall Analysis Engine

The `analyse-heimdall.ts` script is the core analysis engine for HawkEye. It processes pending analysis jobs from the database queue.

### Prerequisites

1. **Environment Variables**: Set up the following environment variables:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
   ```

2. **AWS Permissions**: Ensure the IAM roles have the following permissions:
   - S3: `s3:ListBucket`, `s3:GetObject`, `s3:GetBucketAnalyticsConfiguration`, `s3:PutBucketAnalyticsConfiguration`, `s3:GetBucketInventoryConfiguration`, `s3:PutBucketInventoryConfiguration`, `s3:CreateBucket`
   - EC2: `ec2:DescribeInstances`, `ec2:DescribeVolumes`, `ec2:DescribeSecurityGroups`
   - CloudWatch: `cloudwatch:GetMetricStatistics`

### Usage

```bash
# Run analysis once
bun run analyze

# Run analysis with file watching (for development)
bun run analyze:watch

# Run directly
bun run scripts/analyse-heimdall.ts
```

### What it does

1. **Finds Pending Jobs**: Queries the database for analysis runs with status 'pending'
2. **Processes Jobs Sequentially**: Handles one job at a time to avoid resource conflicts
3. **Runs Service Analysis**: 
   - S3 analysis (if enabled): Storage class optimization recommendations
   - EC2/EBS analysis (if enabled): Instance utilization and unused volume detection
4. **Generates AI Reports**: Creates detailed recommendations with cost savings
5. **Updates Database**: Stores results and updates job status

### Job Processing Flow

```
pending → running → completed/failed
```

### Real AWS Analysis

The engine now performs real AWS analysis with a modular architecture and inventory-based S3 analysis:

#### S3 Analysis (Inventory-Based)
- **Object Age Analysis**: Uses S3 inventory reports to identify old objects and recommend lifecycle policies
- **Parquet Compaction**: Detects small parquet files that need compaction for better performance
- **Partitioning Analysis**: Recommends directory partitioning strategies for improved query performance
- **Cross-Region Handling**: Automatically detects bucket regions and handles PermanentRedirect errors
- **Security Analysis**: Evaluates bucket configurations and access policies
- **Cost Optimization**: Provides quantified savings estimates for lifecycle and storage optimizations

#### EC2/EBS Analysis
- **Instance Utilization**: Gathers CloudWatch metrics and provides rightsizing recommendations
- **Unused Volume Detection**: Identifies unattached EBS volumes for cost savings
- **Security Analysis**: Reviews security group configurations and access patterns

#### Key Features
- **AI Integration**: Uses Google Gemini with Zod schemas to generate structured, actionable recommendations
- **Automatic Setup**: Creates necessary S3 analytics and inventory configurations
- **Error Resilience**: Graceful fallback when inventory data is unavailable
- **Modular Design**: Split into focused services for maintainability and testing

### Error Handling

- Jobs that fail are marked with status 'failed' and error message
- Engine continues processing remaining jobs even if one fails
- Comprehensive logging for debugging

### Monitoring

The script outputs detailed logs:
- 🚀 Engine startup
- 📋 Job discovery
- 🔍 Job processing
- 📦 S3 analysis
- 🖥️ EC2/EBS analysis  
- ✅ Success completion
- ❌ Error handling
#
# Architecture

The analysis engine is now split into focused modules:

### Core Modules

- **`analyse-heimdall.ts`** - Main orchestration engine
- **`src/lib/analysis/schemas.ts`** - Zod schemas for AI response validation
- **`src/lib/analysis/aws-credentials.ts`** - AWS STS role assumption
- **`src/lib/analysis/s3-service.ts`** - S3 bucket analysis and setup
- **`src/lib/analysis/ec2-service.ts`** - EC2/EBS infrastructure analysis
- **`src/lib/analysis/types.ts`** - TypeScript type definitions

### Benefits of Modular Design

1. **Maintainability**: Each service has a single responsibility
2. **Testability**: Services can be unit tested independently
3. **Reusability**: Services can be used in other parts of the application
4. **Type Safety**: Zod schemas ensure AI responses match expected structure
5. **Error Isolation**: Failures in one service don't affect others

### Schema Validation

Uses Zod schemas to validate AI-generated responses:
- **S3BucketAnalysisSchema**: Validates S3 bucket analysis structure
- **EC2InstanceAnalysisSchema**: Validates EC2 infrastructure analysis
- Ensures consistent, type-safe data throughout the application
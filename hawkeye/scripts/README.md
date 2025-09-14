# HawkEye Analysis Scripts

## Heimdall Analysis Engine

The `analyse-heimdall.ts` script is the core analysis engine for HawkEye. It processes pending analysis jobs from the database queue.

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

### Mock Data

Currently generates realistic mock data for testing:
- S3 recommendations for storage class optimization
- EC2 recommendations for instance rightsizing  
- EBS recommendations for unused volumes
- AI-generated reports explaining each recommendation

### Production Implementation

In production, replace mock data generation with:
- AWS SDK calls to gather real resource data
- CloudWatch metrics analysis
- S3 Inventory and Storage Class Analytics processing
- Real AI model integration for report generation

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
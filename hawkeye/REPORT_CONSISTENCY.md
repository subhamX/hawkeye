# Report Consistency System

## Overview

The HawkEye analysis system now includes a sophisticated report consistency mechanism that ensures cost savings and recommendations don't fluctuate wildly between analysis runs. This provides users with stable, reliable recommendations while still adapting to real infrastructure changes.

## How It Works

### 1. Last Report Retrieval

Before generating new recommendations, the system:
- Retrieves the last completed analysis results for the account
- Extracts previous S3 and EC2/EBS recommendations and savings
- Uses this data as a baseline for consistency checking

### 2. Consistency Logic Application

The system applies several consistency rules:

#### **Savings Smoothing**
- **S3**: Maximum 30% variation allowed between reports
- **EC2**: Maximum 25% variation allowed between reports  
- **EBS**: Maximum 20% variation allowed between reports

If new savings exceed these thresholds, the system applies smoothing:
```
smoothed_savings = new_savings * 0.7 + old_savings * 0.3
```

#### **Confidence Averaging**
For existing recommendations, confidence scores are averaged between the new and previous analysis to provide stability.

#### **Persistent Recommendations**
High-confidence recommendations (>0.7) from previous reports are retained even if temporarily not detected, with slightly reduced savings (90% of original).

### 3. Stability Metrics

The system calculates several metrics:

- **S3 Savings Variation**: Percentage change in S3 savings
- **EC2 Savings Variation**: Percentage change in EC2/EBS savings  
- **Recommendations Changed**: Count of significantly changed recommendations
- **Stability Score**: Overall stability rating (0-1, where 1 is most stable)

### 4. Enhanced Reporting

Recommendations now include consistency indicators:
- `[NEW]` - First-time recommendation
- `[PERSISTENT]` - Carried over from previous analysis
- `[Note: Savings estimate smoothed for consistency...]` - When smoothing was applied

## Benefits

### For Users
- **Predictable Savings**: Cost estimates don't jump around dramatically
- **Reliable Planning**: Can trust recommendations for budget planning
- **Change Awareness**: Clear indicators when new issues are detected

### For Operations
- **Reduced Alert Fatigue**: Fewer false positive changes
- **Better Trending**: Cleaner data for long-term analysis
- **Quality Assurance**: Automatic validation against previous results

## Configuration

The consistency thresholds can be adjusted in `report-consistency.ts`:

```typescript
// Maximum allowed variation before smoothing kicks in
const maxVariationThreshold = {
  s3: 0.3,    // 30%
  ec2: 0.25,  // 25% 
  ebs: 0.2    // 20%
};

// Smoothing factor (70% new, 30% old)
const smoothingFactor = 0.7;
```

## Example Output

```
📊 Consistency applied: S3 variation 7.9%, EC2 variation 6.4%, stability score 0.91
📊 Consistency report: Stability score 1.00, 0 recommendations changed
```

## Testing

Run the consistency test to verify the system:

```bash
bun run scripts/test-consistency.ts
```

This will show how the system handles:
- First analysis (no previous report)
- Subsequent analysis with consistency applied
- Detailed comparison of original vs. consistent recommendations

## Implementation Details

### Key Files

- `src/lib/analysis/report-consistency.ts` - Main consistency service
- `scripts/analyse-heimdall.ts` - Updated analysis engine
- `scripts/test-consistency.ts` - Test suite

### Database Integration

The system uses existing database tables:
- `analysis_runs` - To find previous completed analyses
- `s3_analysis_results` - For S3 recommendation history
- `ec2_analysis_results` - For EC2/EBS recommendation history

### Error Handling

- Gracefully handles missing previous reports (first analysis)
- Falls back to new recommendations if consistency service fails
- Logs all consistency operations for debugging

## Future Enhancements

Potential improvements:
- Machine learning-based anomaly detection
- Configurable consistency rules per account
- Trend analysis over multiple reports
- User-configurable sensitivity settings
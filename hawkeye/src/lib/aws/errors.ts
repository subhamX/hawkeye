export class AWSError extends Error {
  constructor(
    message: string,
    public code?: string,
    public service?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AWSError';
  }
}

export function mapAWSError(error: any): AWSError {
  if (error instanceof AWSError) {
    return error;
  }

  // Handle AWS SDK errors
  if (error.$metadata) {
    const awsError = error as any;
    return new AWSError(
      getUserFriendlyMessage(awsError.name, awsError.message),
      awsError.name,
      awsError.$service,
      error
    );
  }

  // Handle generic errors
  return new AWSError(
    error.message || 'An unknown AWS error occurred',
    'UnknownError',
    undefined,
    error
  );
}

function getUserFriendlyMessage(errorCode: string, originalMessage: string): string {
  const errorMessages: Record<string, string> = {
    AccessDenied: 'Access denied. Please check your IAM role permissions.',
    InvalidUserID: 'Invalid AWS account or user ID.',
    NoSuchBucket: 'The specified S3 bucket does not exist.',
    BucketAlreadyExists: 'A bucket with this name already exists.',
    InvalidBucketName: 'The bucket name is invalid. Please check the naming requirements.',
    TokenRefreshRequired: 'Your AWS session has expired. Please refresh your credentials.',
    ThrottlingException: 'AWS API rate limit exceeded. Please try again in a moment.',
    UnauthorizedOperation: 'You are not authorized to perform this operation.',
    InvalidParameterValue: 'One or more parameters are invalid.',
    ResourceNotFound: 'The requested AWS resource was not found.',
    ServiceUnavailable: 'AWS service is temporarily unavailable. Please try again later.',
    NetworkingError: 'Network error occurred while connecting to AWS.',
    TimeoutError: 'Request timed out. Please check your connection and try again.',
  };

  return errorMessages[errorCode] || originalMessage || 'An unexpected error occurred';
}

export function isRetryableError(error: AWSError): boolean {
  const retryableCodes = [
    'ThrottlingException',
    'ServiceUnavailable',
    'NetworkingError',
    'TimeoutError',
    'InternalError',
    'ServiceException',
  ];

  return retryableCodes.includes(error.code || '');
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: AWSError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = mapAWSError(error);

      if (attempt === maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
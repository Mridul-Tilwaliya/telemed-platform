/**
 * Retry utility with exponential backoff
 * Implements retry strategy for database operations and external API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors'>> & { retryableErrors?: (error: Error) => boolean } = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  backoffMultiplier: 2,
  retryableErrors: (error: Error) => {
    // Retry on network errors, timeouts, and transient database errors
    const retryableMessages = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'timeout',
      'connection',
      'deadlock',
      'lock',
    ];
    return retryableMessages.some((msg) => error.message.toLowerCase().includes(msg));
  },
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (opts.retryableErrors && !opts.retryableErrors(lastError)) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry strategy for database operations
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  return retryWithBackoff(operation, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryableErrors: (error: Error) => {
      // Retry on connection errors and deadlocks
      const message = error.message.toLowerCase();
      return (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('deadlock') ||
        message.includes('lock')
      );
    },
  });
}

/**
 * Retry strategy for external API calls
 */
export async function retryApiCall<T>(
  operation: () => Promise<T>
): Promise<T> {
  return retryWithBackoff(operation, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryableErrors: (error: Error) => {
      // Retry on network errors and 5xx status codes
      const message = error.message.toLowerCase();
      return (
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('enotfound') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      );
    },
  });
}


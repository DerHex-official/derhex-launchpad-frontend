import { getPublicClient, clearClientCache } from "../../config/publicClient";
import { CHAIN_ID } from "../source";

/**
 * Helper function to get the public client
 * This ensures that all web3 utilities use the same client instance
 * and that the client is always up-to-date with the selected chain
 */
// Keep track of the last chain ID used
let lastChainId: string | null = null;

// Rate limiting variables
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_SECOND = 5; // Increased from 3 for better throughput
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window

// Track consecutive errors to implement circuit breaker pattern
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;
let circuitBreakerTimeout = 0;

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Apply rate limiting to API calls
 * This function can be called before making API requests to avoid rate limits
 */
export const applyRateLimit = async (): Promise<void> => {
  const now = Date.now();

  // Check if circuit breaker is active
  if (circuitBreakerTimeout > now) {
    const waitTime = circuitBreakerTimeout - now;
    console.log(`Circuit breaker active. Waiting ${waitTime}ms before next request`);
    await delay(waitTime);
    // Reset circuit breaker after waiting
    circuitBreakerTimeout = 0;
    consecutiveErrors = 0;
  }

  // Remove timestamps older than our window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  // If we've hit the rate limit, wait until we can make another request
  if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const oldestTimestamp = requestTimestamps[0];
    const waitTime = RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp);

    if (waitTime > 0) {
      console.log(`Rate limit reached. Waiting ${waitTime}ms before next request`);
      await delay(waitTime + 100); // Add a larger buffer
    }
  }

  // Add a small random delay to avoid synchronized requests
  const jitter = Math.floor(Math.random() * 50);
  await delay(jitter);

  // Add current timestamp to the list
  requestTimestamps.push(Date.now());
};

/**
 * Record an error and potentially trigger the circuit breaker
 */
export const recordError = (error: any): void => {
  // Check if it's a rate limit error
  const isRateLimitError = error?.message?.includes('429');

  if (isRateLimitError) {
    consecutiveErrors++;
    console.warn(`Rate limit error detected. Consecutive errors: ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}`);

    // If we've hit the threshold, activate the circuit breaker
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      const backoffTime = 5000 * Math.pow(2, Math.min(consecutiveErrors - MAX_CONSECUTIVE_ERRORS, 5));
      circuitBreakerTimeout = Date.now() + backoffTime;
      console.warn(`Circuit breaker activated. Pausing requests for ${backoffTime}ms`);
    }
  } else {
    // For non-rate limit errors, we still count them but with less weight
    consecutiveErrors = Math.min(consecutiveErrors + 0.5, MAX_CONSECUTIVE_ERRORS);
  }
};

/**
 * Record a successful request and reset error counter
 */
export const recordSuccess = (): void => {
  consecutiveErrors = Math.max(0, consecutiveErrors - 1);
};

/**
 * Get the public client for the current chain
 * This is a synchronous function to maintain compatibility with existing code
 */
export function getClient() {
  try {
    // Check if the chain has changed
    if (lastChainId !== CHAIN_ID) {
      console.log(`Chain changed from ${lastChainId || 'initial'} to ${CHAIN_ID}, getting new client`);
      // Clear the client cache when the chain changes
      clearClientCache();
      lastChainId = CHAIN_ID;
    }

    // Get the client for the current chain
    return getPublicClient();
  } catch (error) {
    console.error('Error getting client:', error);
    // If there's an error, clear the cache and try again
    clearClientCache();
    lastChainId = null;
    return getPublicClient();
  }
}

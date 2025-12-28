/**
 * Error simulation utilities for hard tier testing
 */

// Request counter for rate limiting simulation
let requestCounter = 0;

/**
 * Increment and get the current request count
 */
export function getRequestCount() {
  return ++requestCounter;
}

/**
 * Reset request counter (for testing)
 */
export function resetRequestCounter() {
  requestCounter = 0;
}

/**
 * Simulate random server error (10% chance)
 * @returns {object|null} Error response or null
 */
export function maybeServerError() {
  if (Math.random() < 0.1) {
    return {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Random server failure for testing',
    };
  }
  return null;
}

/**
 * Simulate malformed JSON (5% chance)
 * @returns {string|null} Malformed JSON string or null
 */
export function maybeMalformedJson() {
  if (Math.random() < 0.05) {
    return '{"data": [{"id": 1, "name": "broken"'; // Missing closing braces
  }
  return null;
}

/**
 * Simulate empty response (3% chance)
 * @returns {boolean} True if should return empty response
 */
export function maybeEmptyResponse() {
  return Math.random() < 0.03;
}

/**
 * Check if rate limit should be triggered (every 5th request)
 * @returns {boolean} True if rate limited
 */
export function isRateLimited() {
  return requestCounter % 5 === 0;
}

/**
 * Generate HTML error page (for simulating wrong content type)
 */
export function htmlErrorPage(statusCode, message) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Error ${statusCode}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #c00; }
    .error-code { font-size: 72px; color: #999; }
  </style>
</head>
<body>
  <div class="error-code">${statusCode}</div>
  <h1>Service Error</h1>
  <p>${message}</p>
  <p>Please try again later.</p>
</body>
</html>`;
}

/**
 * Create a standard error response
 */
export function errorResponse(statusCode, error, message) {
  return {
    statusCode,
    error,
    message,
  };
}

/**
 * Simulate various error conditions based on resource ID
 */
export function getErrorForId(resourceType, id) {
  const conditions = {
    // 404 for deleted resources
    notFound: {
      statusCode: 404,
      error: 'Not Found',
      message: `${resourceType} with id ${id} not found`,
    },
    // 403 for permission denied
    forbidden: {
      statusCode: 403,
      error: 'Forbidden',
      message: `You don't have permission to access this ${resourceType}`,
    },
    // 503 for service unavailable
    unavailable: {
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'The service is temporarily unavailable',
    },
    // 429 for rate limit
    rateLimit: {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please retry after the specified time.',
      headers: { 'Retry-After': '2' },
    },
  };

  return conditions;
}

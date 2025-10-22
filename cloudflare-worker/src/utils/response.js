/**
 * Create a standardized JSON response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {Object} headers - Additional headers
 * @returns {Response} Cloudflare Response object
 */
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders(),
      ...headers
    }
  });
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {string} code - Error code enum
 * @param {number} status - HTTP status code
 * @returns {Response} Error response
 */
export function errorResponse(message, code = 'ERROR', status = 500) {
  return jsonResponse({
    error: message,
    code
  }, status);
}

/**
 * Get CORS headers for responses
 * @param {string} origin - Request origin (optional)
 * @returns {Object} CORS headers
 */
export function getCORSHeaders(origin = null) {
  const allowedOrigins = [
    'https://arttherapy-plus.pages.dev',
    'http://localhost:5173'
  ];

  // Allow origin if in whitelist or use first allowed origin as default
  const allowOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Handle CORS preflight requests
 * @returns {Response} CORS preflight response
 */
export function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  });
}

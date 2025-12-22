/**
 * Create a standardized JSON response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {Object} headers - Additional headers
 * @param {string|null} origin - Request origin for CORS validation
 * @returns {Response} Cloudflare Response object
 */
export function jsonResponse(data, status = 200, headers = {}, origin = null) {
  const corsHeaders = getCORSHeaders(origin);

  // Build response headers - only include CORS headers if origin is whitelisted
  // Non-whitelisted origins will receive responses without CORS headers,
  // which browsers will block due to same-origin policy
  const responseHeaders = {
    'Content-Type': 'application/json',
    ...(corsHeaders || {}),
    ...headers
  };

  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders
  });
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {string} code - Error code enum
 * @param {number} status - HTTP status code
 * @param {string|null} origin - Request origin for CORS validation (optional)
 * @param {Object} extraHeaders - Additional headers (e.g., Retry-After for rate limiting)
 * @returns {Response} Error response
 */
export function errorResponse(message, code = 'ERROR', status = 500, origin = null, extraHeaders = {}) {
  return jsonResponse({
    error: message,
    code
  }, status, extraHeaders, origin);
}

/**
 * Get CORS headers for responses
 *
 * SECURITY: This function implements strict origin validation.
 * - Returns CORS headers ONLY for whitelisted origins
 * - Returns null for non-whitelisted origins (browser will block the response)
 * - This prevents CORS bypass attacks from malicious origins
 *
 * @param {string|null} origin - Request origin header value
 * @returns {Object|null} CORS headers if origin is whitelisted, null otherwise
 */
export function getCORSHeaders(origin) {
  const allowedOrigins = [
    'https://arttherapy-plus.pages.dev',
    'http://localhost:5173'
  ];

  // SECURITY: Only return CORS headers for explicitly whitelisted origins
  // Non-whitelisted origins receive null, meaning no CORS headers will be added
  // The browser's same-origin policy will then block the response
  if (!origin || !allowedOrigins.includes(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'  // Required for proper caching when CORS varies by origin
  };
}

/**
 * Handle CORS preflight requests
 *
 * SECURITY: Rejects preflight requests from non-whitelisted origins with 403 Forbidden.
 * This prevents attackers from discovering if endpoints exist via preflight.
 *
 * @param {string|null} origin - Request origin header value
 * @returns {Response} CORS preflight response (204 if allowed, 403 if rejected)
 */
export function handleCORS(origin) {
  const corsHeaders = getCORSHeaders(origin);

  // SECURITY: Reject preflight from non-whitelisted origins with 403
  if (!corsHeaders) {
    return new Response('Forbidden', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

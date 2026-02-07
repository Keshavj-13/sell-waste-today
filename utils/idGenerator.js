/**
 * ID Generator Utility
 * Generates unique identifiers for requests and routes
 */

function generateRequestId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `REQ-${timestamp}-${random}`;
}

function generateRouteId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `ROUTE-${timestamp}-${random}`;
}

module.exports = {
  generateRequestId,
  generateRouteId
};

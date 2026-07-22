const AuditLog = require('../models/AuditLog');

/**
 * Resolve the real client IP, honouring reverse-proxy headers.
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; the first is the originating client
    return forwarded.split(',')[0].trim();
  }
  return (
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    ''
  );
}

/**
 * Create an AuditLog document asynchronously.
 * Failures are swallowed and logged to stderr so they never break the main request.
 *
 * @param {import('express').Request} req         - Express request (must have req.user set by protect middleware)
 * @param {'CREATE'|'UPDATE'|'DELETE'} action     - The operation performed
 * @param {string}  resource                      - Model/resource name, e.g. 'Invoice'
 * @param {*}       resourceId                    - The _id of the affected document
 * @param {string}  [resourceNo='']               - Human-readable ID, e.g. invoice number
 * @param {string}  [description='']              - Free-text description of what happened
 * @param {*}       [oldValues=null]              - Document state BEFORE the operation
 * @param {*}       [newValues=null]              - Document state AFTER the operation
 * @returns {Promise<void>}
 */
async function logAudit(
  req,
  action,
  resource,
  resourceId,
  resourceNo = '',
  description = '',
  oldValues = null,
  newValues = null
) {
  try {
    if (!req.user) return; // unauthenticated calls — skip silently

    await AuditLog.create({
      userId:      req.user._id || req.user.id,
      action,
      resource,
      resourceId,
      resourceNo:  String(resourceNo || ''),
      description: String(description || ''),
      ipAddress:   getClientIp(req),
      oldValues,
      newValues
    });
  } catch (err) {
    // Audit logging must never crash the application
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };

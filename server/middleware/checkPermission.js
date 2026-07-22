/**
 * checkPermission — middleware factory for fine-grained permission checks.
 *
 * Usage:
 *   router.post('/', protect, checkPermission('canCreateInvoice'), handler)
 *
 * Rules:
 *   - Users with isOwner === true bypass ALL permission checks.
 *   - Staff users must have the specific permission key set to `true`
 *     on their `permissions` object, otherwise a 403 is returned.
 *
 * @param {string} permKey — one of the boolean keys in the permissions schema:
 *   canCreateInvoice | canEditInvoice | canDeleteInvoice | canViewReports |
 *   canManageParties | canManageProducts | canManageExpenses | canManageStaff
 */
const checkPermission = (permKey) => (req, res, next) => {
  // Owners (self-registered) have unrestricted access
  if (req.user && req.user.isOwner) return next();

  // Staff must have the explicit permission flag enabled
  if (!req.user || !req.user.permissions || !req.user.permissions[permKey]) {
    return res.status(403).json({
      success: false,
      error: 'Permission denied',
      required: permKey
    });
  }

  next();
};

module.exports = checkPermission;

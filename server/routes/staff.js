const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const StaffInvite = require('../models/StaffInvite');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// ─── Helpers ────────────────────────────────────────────────────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

/** Generate a cryptographically secure random token */
const generateInviteToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Resolve companyId for the authenticated user.
 * - Owner: look up Company where userId === req.user._id
 * - Staff: use req.user.companyId directly
 */
const resolveCompanyId = async (user) => {
  if (user.isOwner) {
    const company = await Company.findOne({ userId: user._id });
    return company ? company._id : null;
  }
  return user.companyId || null;
};

/** Default permissions preset per role */
const defaultPermissionsForRole = (role) => {
  const base = {
    canCreateInvoice:  false,
    canEditInvoice:    false,
    canDeleteInvoice:  false,
    canViewReports:    false,
    canManageParties:  false,
    canManageProducts: false,
    canManageExpenses: false,
    canManageStaff:    false
  };

  switch (role) {
    case 'accountant':
      return { ...base, canCreateInvoice: true, canEditInvoice: true, canViewReports: true, canManageExpenses: true };
    case 'salesperson':
      return { ...base, canCreateInvoice: true, canManageParties: true, canManageProducts: true };
    case 'viewer':
      return { ...base, canViewReports: true };
    default:
      return base;
  }
};

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/staff/invite
 * Owner sends an invite to a staff member's email.
 * Requires: protect + canManageStaff permission
 */
router.post(
  '/invite',
  protect,
  checkPermission('canManageStaff'),
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('role')
      .optional()
      .isIn(['accountant', 'salesperson', 'viewer'])
      .withMessage('Role must be accountant, salesperson, or viewer'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty if provided')
  ],
  validate,
  async (req, res) => {
    try {
      const { email, name, role = 'salesperson', permissions } = req.body;

      // Resolve which company this owner manages
      const companyId = await resolveCompanyId(req.user);
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'No company profile found. Please create your company profile first.'
        });
      }

      // Prevent duplicate pending invites for the same email + company
      const existing = await StaffInvite.findOne({
        companyId,
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'A pending invite for this email already exists.'
        });
      }

      // Check if user is already staff for this company
      const alreadyStaff = await User.findOne({ email: email.toLowerCase(), companyId });
      if (alreadyStaff) {
        return res.status(400).json({
          success: false,
          error: 'This user is already a member of your company.'
        });
      }

      // Merge caller-supplied permissions with role defaults
      const resolvedPermissions = {
        ...defaultPermissionsForRole(role),
        ...(permissions && typeof permissions === 'object' ? permissions : {})
      };

      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invite = await StaffInvite.create({
        companyId,
        invitedBy: req.user._id,
        email,
        name,
        role,
        permissions: resolvedPermissions,
        token,
        expiresAt
      });

      // Build the invite link (CLIENT_URL from env, fallback to localhost)
      const clientUrl = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',')[0].trim()
        : 'http://localhost:3000';
      const inviteLink = `${clientUrl}/staff/accept/${token}`;

      res.status(201).json({
        success: true,
        data: {
          invite: {
            _id: invite._id,
            email: invite.email,
            name: invite.name,
            role: invite.role,
            permissions: invite.permissions,
            status: invite.status,
            expiresAt: invite.expiresAt
          },
          inviteLink
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/staff/accept/:token
 * Public route — validate the invite token and return invite info so the
 * frontend can pre-fill the registration form.
 */
router.get('/accept/:token', async (req, res) => {
  try {
    const invite = await StaffInvite.findOne({ token: req.params.token })
      .populate('companyId', 'businessName city state logo')
      .populate('invitedBy', 'name email');

    if (!invite) {
      return res.status(404).json({ success: false, error: 'Invite not found or already used.' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Invite has already been ${invite.status}.` });
    }
    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ success: false, error: 'Invite link has expired.' });
    }

    res.json({
      success: true,
      data: {
        email: invite.email,
        name: invite.name,
        role: invite.role,
        company: invite.companyId,
        invitedBy: invite.invitedBy,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/staff/accept/:token
 * Public route — staff member accepts the invite and creates their account.
 * Body: { name, password, phone }
 */
router.post(
  '/accept/:token',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const invite = await StaffInvite.findOne({ token: req.params.token });

      if (!invite) {
        return res.status(404).json({ success: false, error: 'Invite not found or already used.' });
      }
      if (invite.status !== 'pending') {
        return res.status(400).json({ success: false, error: `Invite has already been ${invite.status}.` });
      }
      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ success: false, error: 'Invite link has expired.' });
      }

      const { name, password, phone } = req.body;

      // Check if this email is already registered
      const existingUser = await User.findOne({ email: invite.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email already exists. Please contact your company owner.'
        });
      }

      // Create the staff user linked to the company
      const staffUser = await User.create({
        name,
        email: invite.email,
        password,
        phone: phone || '',
        companyId: invite.companyId,
        staffRole: invite.role,
        permissions: invite.permissions,
        isOwner: false,
        role: 'user'
      });

      // Mark invite as accepted
      invite.status = 'accepted';
      invite.acceptedBy = staffUser._id;
      await invite.save();

      const token = staffUser.generateToken();

      res.status(201).json({
        success: true,
        data: {
          _id: staffUser._id,
          name: staffUser.name,
          email: staffUser.email,
          phone: staffUser.phone,
          companyId: staffUser.companyId,
          staffRole: staffUser.staffRole,
          permissions: staffUser.permissions,
          isOwner: staffUser.isOwner,
          token
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/staff
 * List all staff members for the authenticated user's company.
 * Requires: protect + canManageStaff
 */
router.get('/', protect, checkPermission('canManageStaff'), async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company profile found.' });
    }

    const staffMembers = await User.find({ companyId, isOwner: false })
      .select('-password')
      .sort({ createdAt: -1 });

    // Also fetch pending invites so the owner knows who hasn't accepted yet
    const pendingInvites = await StaffInvite.find({
      companyId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).select('email name role permissions expiresAt createdAt');

    res.json({
      success: true,
      data: staffMembers,
      count: staffMembers.length,
      pendingInvites,
      pendingCount: pendingInvites.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/staff/:userId/permissions
 * Owner updates a staff member's permissions and/or role.
 * Requires: protect + canManageStaff
 */
router.put(
  '/:userId/permissions',
  protect,
  checkPermission('canManageStaff'),
  [
    body('permissions').optional().isObject().withMessage('Permissions must be an object'),
    body('role')
      .optional()
      .isIn(['accountant', 'salesperson', 'viewer'])
      .withMessage('Role must be accountant, salesperson, or viewer')
  ],
  validate,
  async (req, res) => {
    try {
      const companyId = await resolveCompanyId(req.user);
      if (!companyId) {
        return res.status(400).json({ success: false, error: 'No company profile found.' });
      }

      // Only allow updating staff that belong to this company
      const staffUser = await User.findOne({
        _id: req.params.userId,
        companyId,
        isOwner: false
      });

      if (!staffUser) {
        return res.status(404).json({
          success: false,
          error: 'Staff member not found in your company.'
        });
      }

      const updates = {};

      if (req.body.role) {
        updates.staffRole = req.body.role;
      }

      if (req.body.permissions && typeof req.body.permissions === 'object') {
        // Only allow boolean permission keys; merge with existing
        const allowedKeys = [
          'canCreateInvoice', 'canEditInvoice', 'canDeleteInvoice',
          'canViewReports', 'canManageParties', 'canManageProducts',
          'canManageExpenses', 'canManageStaff'
        ];
        const sanitised = {};
        for (const key of allowedKeys) {
          if (typeof req.body.permissions[key] === 'boolean') {
            sanitised[`permissions.${key}`] = req.body.permissions[key];
          }
        }
        Object.assign(updates, sanitised);
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update.' });
      }

      const updated = await User.findByIdAndUpdate(
        req.params.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * DELETE /api/staff/:userId
 * Owner removes a staff member from the company.
 * Requires: protect + canManageStaff
 */
router.delete('/:userId', protect, checkPermission('canManageStaff'), async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req.user);
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'No company profile found.' });
    }

    // Guard: can only remove staff from own company, never another owner
    const staffUser = await User.findOne({
      _id: req.params.userId,
      companyId,
      isOwner: false
    });

    if (!staffUser) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found in your company.'
      });
    }

    // Detach from company instead of deleting the account (preserves audit trail)
    staffUser.companyId = null;
    staffUser.staffRole = null;
    staffUser.permissions = null;
    await staffUser.save();

    res.json({ success: true, data: {}, message: 'Staff member removed from company.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/staff/me/permissions
 * Any authenticated user can fetch their own permissions snapshot.
 */
router.get('/me/permissions', protect, async (req, res) => {
  try {
    // Owners: return a synthetic "all true" permissions object
    if (req.user.isOwner) {
      return res.json({
        success: true,
        data: {
          isOwner: true,
          staffRole: 'owner',
          permissions: {
            canCreateInvoice:  true,
            canEditInvoice:    true,
            canDeleteInvoice:  true,
            canViewReports:    true,
            canManageParties:  true,
            canManageProducts: true,
            canManageExpenses: true,
            canManageStaff:    true
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        isOwner: false,
        staffRole: req.user.staffRole,
        permissions: req.user.permissions || {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

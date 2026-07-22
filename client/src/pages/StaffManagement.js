import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Loading from '../components/Loading';

// ─── Permission definitions ────────────────────────────────────────────────────
const ALL_PERMISSIONS = [
  { key: 'canCreateInvoices',  label: 'Can Create Invoices',   icon: 'fas fa-file-plus' },
  { key: 'canEditInvoices',    label: 'Can Edit Invoices',     icon: 'fas fa-file-edit' },
  { key: 'canDeleteInvoices',  label: 'Can Delete Invoices',   icon: 'fas fa-file-times' },
  { key: 'canViewReports',     label: 'Can View Reports',      icon: 'fas fa-chart-bar' },
  { key: 'canManageParties',   label: 'Can Manage Parties',    icon: 'fas fa-users' },
  { key: 'canManageProducts',  label: 'Can Manage Products',   icon: 'fas fa-box' },
  { key: 'canManageExpenses',  label: 'Can Manage Expenses',   icon: 'fas fa-money-bill-wave' },
  { key: 'canManageStaff',     label: 'Can Manage Staff',      icon: 'fas fa-users-cog' },
];

// ─── Role presets ──────────────────────────────────────────────────────────────
const ROLE_PRESETS = {
  Owner: {
    canCreateInvoices: true, canEditInvoices: true, canDeleteInvoices: true,
    canViewReports: true, canManageParties: true, canManageProducts: true,
    canManageExpenses: true, canManageStaff: true,
  },
  Accountant: {
    canCreateInvoices: true, canEditInvoices: true, canDeleteInvoices: false,
    canViewReports: true, canManageParties: true, canManageProducts: false,
    canManageExpenses: true, canManageStaff: false,
  },
  Salesperson: {
    canCreateInvoices: true, canEditInvoices: false, canDeleteInvoices: false,
    canViewReports: false, canManageParties: true, canManageProducts: true,
    canManageExpenses: false, canManageStaff: false,
  },
  Viewer: {
    canCreateInvoices: false, canEditInvoices: false, canDeleteInvoices: false,
    canViewReports: true, canManageParties: false, canManageProducts: false,
    canManageExpenses: false, canManageStaff: false,
  },
};

const EMPTY_PERMISSIONS = ALL_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: false }), {});

// ─── Role badge styling ────────────────────────────────────────────────────────
const getRoleBadgeClass = (role) => {
  const map = {
    Owner:       'staff-role-badge role-owner',
    Accountant:  'staff-role-badge role-accountant',
    Salesperson: 'staff-role-badge role-salesperson',
    Viewer:      'staff-role-badge role-viewer',
  };
  return map[role] || 'staff-role-badge role-viewer';
};

// ─── Permissions Grid Component ────────────────────────────────────────────────
const PermissionGrid = ({ permissions, onChange }) => (
  <div className="permission-grid">
    {ALL_PERMISSIONS.map((perm) => (
      <label key={perm.key} className="permission-item">
        <input
          type="checkbox"
          className="form-check-input me-2"
          checked={!!permissions[perm.key]}
          onChange={(e) => onChange(perm.key, e.target.checked)}
        />
        <i className={`${perm.icon} me-1`} style={{ color: 'var(--primary)', fontSize: '0.78rem', width: 14 }}></i>
        <span className="form-check-label">{perm.label}</span>
      </label>
    ))}
  </div>
);

// ─── Invite Modal ──────────────────────────────────────────────────────────────
const InviteModal = ({ show, onClose, onSuccess }) => {
  const [form, setForm]     = useState({ name: '', email: '', role: 'Viewer' });
  const [perms, setPerms]   = useState({ ...EMPTY_PERMISSIONS });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Apply role preset when role changes
  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, role }));
    setPerms({ ...EMPTY_PERMISSIONS, ...ROLE_PRESETS[role] });
  };

  const handlePermChange = (key, val) => {
    setPerms(p => ({ ...p, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/staff/invite', { ...form, permissions: perms });
      setInviteLink(res.data.inviteLink || res.data.link || '');
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', email: '', role: 'Viewer' });
    setPerms({ ...EMPTY_PERMISSIONS });
    setError('');
    setInviteLink('');
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-bold">
              <i className="fas fa-user-plus me-2" style={{ color: 'var(--primary)' }}></i>
              Invite Staff Member
            </h6>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>

          {inviteLink ? (
            <div className="modal-body">
              <div className="alert alert-success mb-0">
                <div className="fw-semibold mb-2">
                  <i className="fas fa-check-circle me-2"></i>Invite sent successfully!
                </div>
                <div className="small text-muted mb-2">Share this invite link with the staff member:</div>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={inviteLink}
                    readOnly
                    onClick={e => e.target.select()}
                  />
                  <button
                    className="btn btn-sm btn-outline-primary flex-shrink-0"
                    onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger py-2 mb-3">
                    <i className="fas fa-exclamation-circle me-2"></i>{error}
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ravi Kumar"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. ravi@example.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {Object.keys(ROLE_PRESETS).map(role => (
                      <button
                        key={role}
                        type="button"
                        className={`btn btn-sm ${form.role === role ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleRoleChange(role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <div className="small text-muted mt-1">
                    Selecting a role auto-fills the permissions below. You can customise them further.
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label">Permissions</label>
                  <PermissionGrid permissions={perms} onChange={handlePermChange} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending…</>
                    : <><i className="fas fa-paper-plane me-2"></i>Send Invite</>
                  }
                </button>
              </div>
            </form>
          )}

          {inviteLink && (
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Edit Permissions Modal ────────────────────────────────────────────────────
const EditPermissionsModal = ({ show, staff, onClose, onSuccess }) => {
  const [perms, setPerms]   = useState({ ...EMPTY_PERMISSIONS });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (staff) setPerms({ ...EMPTY_PERMISSIONS, ...staff.permissions });
  }, [staff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/staff/${staff._id}/permissions`, { permissions: perms });
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!show || !staff) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-bold">
              <i className="fas fa-shield-alt me-2" style={{ color: 'var(--primary)' }}></i>
              Edit Permissions — {staff.name}
            </h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger py-2 mb-3">
                  <i className="fas fa-exclamation-circle me-2"></i>{error}
                </div>
              )}
              <div className="d-flex align-items-center gap-2 mb-3 p-3"
                style={{ background: 'var(--primary-light)', borderRadius: 'var(--border-radius-sm)' }}>
                <div className="staff-avatar-sm">
                  {staff.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{staff.name}</div>
                  <div className="small text-muted">{staff.email}</div>
                </div>
                <span className={`ms-auto ${getRoleBadgeClass(staff.role)}`}>{staff.role}</span>
              </div>

              <label className="form-label">Permissions</label>
              <PermissionGrid permissions={perms} onChange={(key, val) => setPerms(p => ({ ...p, [key]: val }))} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                  : <><i className="fas fa-save me-2"></i>Save Permissions</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Remove Confirm Modal ──────────────────────────────────────────────────────
const RemoveModal = ({ show, staff, onClose, onConfirm, removing }) => {
  if (!show || !staff) return null;
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog modal-small">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-bold text-danger">
              <i className="fas fa-user-minus me-2"></i>Remove Staff Member
            </h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="mb-1">
              Are you sure you want to remove <strong>{staff.name}</strong> from your account?
            </p>
            <p className="small text-muted mb-0">
              This will revoke their access immediately. This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={removing}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={removing}>
              {removing
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Removing…</>
                : <><i className="fas fa-user-minus me-2"></i>Remove</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [showInvite, setShowInvite]       = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [removeTarget, setRemoveTarget]   = useState(null);
  const [removing, setRemoving]           = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/staff');
      setStaffList(res.data.data || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/staff/${removeTarget._id}`);
      setRemoveTarget(null);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove staff member');
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  };

  const activeCount  = staffList.filter(s => s.status === 'Active').length;
  const pendingCount = staffList.filter(s => s.status === 'Pending').length;

  return (
    <div className="list-page page-enter">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h4 className="page-title">
            <i className="fas fa-users-cog me-2" style={{ color: 'var(--primary)' }}></i>
            Staff &amp; Access Management
          </h4>
          <div className="page-subtitle">
            Manage who has access to your account and what they can do
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <i className="fas fa-user-plus me-2"></i>Invite Staff
        </button>
      </div>

      {/* ── Summary pills ── */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        <div className="summary-card d-flex align-items-center gap-3" style={{ minWidth: 160 }}>
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="stat-label">Total Staff</div>
            <div className="stat-value">{staffList.length}</div>
          </div>
        </div>
        <div className="summary-card d-flex align-items-center gap-3" style={{ minWidth: 160 }}>
          <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.12)', color: 'var(--success)' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{activeCount}</div>
          </div>
        </div>
        <div className="summary-card d-flex align-items-center gap-3" style={{ minWidth: 160 }}>
          <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.12)', color: 'var(--warning)' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <div className="stat-label">Pending Invite</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? <Loading /> : (
        <div className="card border-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div style={{ color: 'var(--text-muted)' }}>
                        <i className="fas fa-users fa-2x mb-3 d-block"></i>
                        No staff members yet. Click <strong>Invite Staff</strong> to add someone.
                      </div>
                    </td>
                  </tr>
                ) : staffList.map((member) => {
                  const activePerms = ALL_PERMISSIONS.filter(p => member.permissions?.[p.key]);
                  return (
                    <tr key={member._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="staff-avatar-sm">
                            {member.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="fw-semibold">{member.name}</span>
                        </div>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.82rem' }}>{member.email}</td>
                      <td>
                        <span className={getRoleBadgeClass(member.role)}>{member.role}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {activePerms.length === 0
                            ? <span className="text-muted small">No permissions</span>
                            : activePerms.slice(0, 3).map(p => (
                              <span key={p.key} className="badge bg-info" style={{ fontSize: '0.65rem' }}>
                                {p.label.replace('Can ', '')}
                              </span>
                            ))
                          }
                          {activePerms.length > 3 && (
                            <span className="badge bg-light" style={{ fontSize: '0.65rem' }}>
                              +{activePerms.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${member.status === 'Active' ? 'bg-success' : 'bg-warning'}`}>
                          {member.status === 'Active'
                            ? <><i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>Active</>
                            : <><i className="fas fa-clock me-1" style={{ fontSize: '0.65rem' }}></i>Pending</>
                          }
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            title="Edit Permissions"
                            onClick={() => setEditTarget(member)}
                          >
                            <i className="fas fa-shield-alt"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Remove Staff"
                            onClick={() => setRemoveTarget(member)}
                          >
                            <i className="fas fa-user-minus"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <InviteModal
        show={showInvite}
        onClose={() => setShowInvite(false)}
        onSuccess={() => { setShowInvite(false); fetchStaff(); }}
      />

      <EditPermissionsModal
        show={!!editTarget}
        staff={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={fetchStaff}
      />

      <RemoveModal
        show={!!removeTarget}
        staff={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        removing={removing}
      />
    </div>
  );
};

export default StaffManagement;

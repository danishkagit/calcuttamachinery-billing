import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sections = [
  {
    label: 'Quick Entry',
    items: [
      { path: '/', icon: 'fas fa-th-large', label: 'Dashboard' },
      { path: '/invoices/create', icon: 'fas fa-plus-circle', label: 'New Invoice' },
      { path: '/invoices/create?type=Credit+Note', icon: 'fas fa-undo-alt', label: 'Credit Note' },
      { path: '/invoices/create?type=Debit+Note', icon: 'fas fa-exchange-alt', label: 'Debit Note' },
      { path: '/expenses/add', icon: 'fas fa-money-bill-wave', label: 'Add Expense' },
    ],
  },
  {
    label: 'Masters',
    items: [
      { path: '/parties', icon: 'fas fa-users', label: 'Parties' },
      { path: '/products', icon: 'fas fa-box', label: 'Products' },
      { path: '/inventory', icon: 'fas fa-boxes', label: 'Inventory' },
      { path: '/labour', icon: 'fas fa-user-clock', label: 'Labour' },
      { path: '/barcodes', icon: 'fas fa-qrcode', label: 'Barcode Generator' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { path: '/invoices', icon: 'fas fa-file-invoice', label: 'All Invoices' },
      { path: '/purchase-register', icon: 'fas fa-shopping-cart', label: 'Purchase Register' },
      { path: '/payments', icon: 'fas fa-credit-card', label: 'Payments' },
      { path: '/expenses', icon: 'fas fa-money-bill-wave', label: 'Expenses' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/reports/sales', icon: 'fas fa-chart-bar', label: 'Sales Report' },
      { path: '/reports/purchases', icon: 'fas fa-shopping-cart', label: 'Purchase Report' },
      { path: '/profit-loss', icon: 'fas fa-chart-line', label: 'Profit & Loss' },
      { path: '/analytics', icon: 'fas fa-chart-pie', label: 'Analytics' },
      { path: '/reports/outstanding', icon: 'fas fa-clock', label: 'Outstanding' },
      { path: '/tally-export', icon: 'fas fa-file-export', label: 'Tally Export' },
    ],
  },
  {
    label: 'GST & Compliance',
    items: [
      { path: '/reports/gstr1', icon: 'fas fa-file-alt', label: 'GSTR-1' },
      { path: '/reports/gstr3b', icon: 'fas fa-file-alt', label: 'GSTR-3B' },
      { path: '/gst-returns', icon: 'fas fa-file-upload', label: 'File Returns' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { path: '/settings', icon: 'fas fa-cog', label: 'All Settings' },
      { path: '/staff', icon: 'fas fa-users-cog', label: 'Staff Accounts' },
      { path: '/audit-trail', icon: 'fas fa-history', label: 'Audit Trail' },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (window.innerWidth < 992) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (window.innerWidth < 992) onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header d-lg-none">
            <div className="sidebar-brand">
            <img src="/logo.png" alt="CM" className="sidebar-brand-logo" />
            <div>
              <div className="fw-bold" style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Calcutta Machinery</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--sidebar-text-muted)' }}>GST BILLING</div>
            </div>
          </div>
          <button className="btn btn-link p-0" style={{ color: 'var(--text-muted)' }} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <ul className="sidebar-nav">
          {sections.map((section, si) => (
            <li key={si}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item, ii) => (
                <NavLink
                  key={ii}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <i className={`${item.icon} sidebar-icon`}></i>
                  <span className="sidebar-text">{item.label}</span>
                </NavLink>
              ))}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          {user && (
            <div className="mb-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.65rem' }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.78rem' }}>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, width: '100%', textAlign: 'center' }}
              >
                <i className="fas fa-sign-out-alt me-1"></i> Sign Out
              </button>
            </div>
          )}
          <div className="gstin-badge">GST Billing v2.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
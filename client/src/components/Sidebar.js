import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const menuItems = [
    { path: '/', icon: 'fas fa-th-large', label: 'Dashboard' },
    {
      icon: 'fas fa-file-invoice', label: 'Sales', children: [
        { path: '/invoices/create', icon: 'fas fa-plus-circle', label: 'New Invoice' },
        { path: '/invoices', icon: 'fas fa-list', label: 'All Invoices' },
        { path: '/reports/sales', icon: 'fas fa-chart-bar', label: 'Sales Report' },
      ]
    },
    {
      icon: 'fas fa-shopping-cart', label: 'Purchase', children: [
        { path: '/invoices/create?type=Purchase', icon: 'fas fa-plus-circle', label: 'New Purchase' },
        { path: '/invoices/create?type=Purchase+Order', icon: 'fas fa-clipboard-list', label: 'Purchase Order' },
        { path: '/reports/purchases', icon: 'fas fa-chart-bar', label: 'Purchase Report' },
      ]
    },
    {
      icon: 'fas fa-file-alt', label: 'Documents', children: [
        { path: '/invoices/create?type=Quotation', icon: 'fas fa-file-invoice-dollar', label: 'Quotation' },
        { path: '/invoices/create?type=Proforma+Invoice', icon: 'fas fa-file-invoice', label: 'Proforma Invoice' },
        { path: '/invoices/create?type=Delivery+Challan', icon: 'fas fa-truck', label: 'Delivery Challan' },
        { path: '/invoices/create?type=Credit+Note', icon: 'fas fa-undo-alt', label: 'Credit Note' },
        { path: '/invoices/create?type=Debit+Note', icon: 'fas fa-exchange-alt', label: 'Debit Note' },
      ]
    },
    {
      icon: 'fas fa-database', label: 'Masters', children: [
        { path: '/parties', icon: 'fas fa-users', label: 'Parties' },
        { path: '/products', icon: 'fas fa-box', label: 'Products' },
      ]
    },
    {
      icon: 'fas fa-chart-pie', label: 'Reports', children: [
        { path: '/reports/gstr1', icon: 'fas fa-file-invoice', label: 'GSTR-1' },
        { path: '/reports/gstr3b', icon: 'fas fa-file-invoice', label: 'GSTR-3B' },
        { path: '/reports/outstanding', icon: 'fas fa-clock', label: 'Outstanding' },
      ]
    },
    {
      icon: 'fas fa-file-export', label: 'GST Returns', children: [
        { path: '/gst-returns', icon: 'fas fa-file-upload', label: 'File Returns' },
      ]
    },
    { path: '/payments', icon: 'fas fa-credit-card', label: 'Payments' },
    { path: '/company', icon: 'fas fa-building', label: 'Company' },
  ];

  const renderMenuItem = (item, index) => {
    if (item.children) {
      return (
        <li key={index} className="sidebar-item">
          <button className="sidebar-link" data-bs-toggle="collapse" data-bs-target={`#sidebar-sub-${index}`}>
            <i className={`${item.icon} sidebar-icon`}></i>
            <span className="sidebar-text">{item.label}</span>
            <i className="fas fa-chevron-down sidebar-arrow ms-auto"></i>
          </button>
          <div className="collapse" id={`sidebar-sub-${index}`}>
            <ul className="sidebar-submenu">
              {item.children.map((child, ci) => (
                <li key={ci}>
                  <NavLink to={child.path} className={({ isActive }) => `sidebar-link sub ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <i className={`${child.icon} sidebar-icon`}></i>
                    <span className="sidebar-text">{child.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </li>
      );
    }
    return (
      <li key={index} className="sidebar-item">
        <NavLink to={item.path} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
          <i className={`${item.icon} sidebar-icon`}></i>
          <span className="sidebar-text">{item.label}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-logo" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(212, 168, 67, 0.5)',
              boxShadow: '0 0 15px var(--primary-glow)'
            }}>
              <img src="/logo.png" alt="CM" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="d-flex flex-column lh-1">
              <span className="fw-bold" style={{ fontSize: '0.95rem', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.3px', color: 'var(--primary)', textShadow: '0 2px 10px var(--primary-glow)' }}>Calcutta Machinery</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '1.5px', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>GST BILLING</span>
            </div>
          </div>
          <button className="btn btn-link text-white d-lg-none p-0" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <ul className="sidebar-nav">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </ul>
        <div className="sidebar-footer">
          {user && (
            <div className="mb-2" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0b0c10', fontWeight: 800, fontSize: '0.65rem'
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.78rem' }}>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none', border: '1px solid var(--glass-border)',
                  borderRadius: 6, padding: '4px 10px',
                  color: '#ef4444', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 600,
                  width: '100%', textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.borderColor = 'rgba(239,68,68,0.3)' }}
                onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.borderColor = 'var(--glass-border)' }}
              >
                <i className="fas fa-sign-out-alt me-1"></i> Sign Out
              </button>
            </div>
          )}
          <div className="gstin-badge">FREE GST Billing</div>
          <div>Calcutta Machinery Billing</div>
          <div>v2.0.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

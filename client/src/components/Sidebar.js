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
    { path: '/invoices/create', icon: 'fas fa-plus-circle', label: 'New Invoice' },
    { path: '/invoices', icon: 'fas fa-file-invoice', label: 'Invoices' },
    { path: '/parties', icon: 'fas fa-users', label: 'Parties' },
    { path: '/products', icon: 'fas fa-box', label: 'Products' },
    { path: '/reports/sales', icon: 'fas fa-chart-bar', label: 'Sales Report' },
    { path: '/reports/purchases', icon: 'fas fa-shopping-cart', label: 'Purchase Report' },
    { path: '/reports/gstr1', icon: 'fas fa-file-alt', label: 'GSTR-1' },
    { path: '/reports/gstr3b', icon: 'fas fa-file-alt', label: 'GSTR-3B' },
    { path: '/reports/outstanding', icon: 'fas fa-clock', label: 'Outstanding' },
    { path: '/gst-returns', icon: 'fas fa-file-upload', label: 'GST Returns' },
    { path: '/payments', icon: 'fas fa-credit-card', label: 'Payments' },
    { path: '/company', icon: 'fas fa-building', label: 'Company' },
    { path: '/settings/templates', icon: 'fas fa-file-signature', label: 'Templates' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header d-lg-none">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="CM" className="sidebar-brand-logo" />
            <div>
              <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#fff' }}>Calcutta Machinery</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--sidebar-text-muted)' }}>GST BILLING</div>
            </div>
          </div>
          <button className="btn btn-link text-white p-0" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <ul className="sidebar-nav">
          {menuItems.map((item, index) => (
            <li key={index} className="sidebar-item">
              <NavLink to={item.path} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                <i className={`${item.icon} sidebar-icon`}></i>
                <span className="sidebar-text">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <div className="gstin-badge">v2.0.0</div>
          <div>Calcutta Machinery Billing</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

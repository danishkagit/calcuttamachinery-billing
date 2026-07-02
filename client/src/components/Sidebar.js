import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
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
            <div className="sidebar-brand-logo">
              <img src="/logo.svg" alt="CM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="d-flex flex-column lh-1">
              <span className="fw-bold" style={{ fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif" }}>Calcutta Machinery</span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3px' }}>GST BILLING</span>
            </div>
          </div>
          <button className="btn btn-link text-white d-lg-none" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <ul className="sidebar-nav">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </ul>
        <div className="sidebar-footer">
          <span className="gstin-badge">FREE GST Billing</span>
          <div>Calcutta Machinery Billing</div>
          <div>v1.0.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

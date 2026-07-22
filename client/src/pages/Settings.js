import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Business',
    icon: 'fas fa-building',
    items: [
      { path: '/company', icon: 'fas fa-building', label: 'Company Profile', desc: 'Business name, address, GSTIN, logo' },
      { path: '/company', icon: 'fas fa-qrcode', label: 'UPI QR Code', desc: 'Set UPI ID for payment QR on invoices' },
    ]
  },
  {
    title: 'Documents',
    icon: 'fas fa-file-invoice',
    items: [
      { path: '/settings/templates', icon: 'fas fa-file-signature', label: 'Invoice Templates', desc: 'Customize invoice designs (7 templates)' },
    ]
  },
  {
    title: 'Data',
    icon: 'fas fa-database',
    items: [
      { path: '/invoices', icon: 'fas fa-file-export', label: 'Export Data', desc: 'Export invoices to CSV' },
    ]
  },
  {
    title: 'Account',
    icon: 'fas fa-user',
    items: [
      { path: '/company', icon: 'fas fa-user-circle', label: 'Profile', desc: 'Manage your account details' },
    ]
  },
];

const Settings = () => {
  return (
    <div className="page-enter">
      <h4 className="fw-bold mb-4">Settings</h4>
      <div className="row g-4">
        {sections.map((section, si) => (
          <div key={si} className="col-md-6">
            <div className="card h-100">
              <div className="card-header bg-white py-3">
                <h6 className="fw-semibold mb-0"><i className={`${section.icon} me-2`} style={{ color: 'var(--primary)' }}></i>{section.title}</h6>
              </div>
              <div className="card-body p-0">
                {section.items.map((item, ii) => (
                  <Link key={ii} to={item.path} className="text-decoration-none">
                    <div className="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <i className={item.icon}></i>
                      </div>
                      <div>
                        <div className="fw-semibold" style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.label}</div>
                        <div className="small" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>
                      <i className="fas fa-chevron-right ms-auto" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}></i>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;

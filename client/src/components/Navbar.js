import React from 'react';
import { Link } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

const Navbar = ({ toggleSidebar }) => {
  const { company } = useCompany();

  return (
    <nav className="main-navbar navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container-fluid">
        <button className="btn btn-link sidebar-toggler d-lg-none me-2" onClick={toggleSidebar} type="button">
          <i className="fas fa-bars"></i>
        </button>
        <Link className="navbar-brand d-flex align-items-center" to="/" style={{ gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            overflow: 'hidden', flexShrink: 0,
            background: 'rgba(212, 175, 55, 0.1)',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '4px'
          }}>
            <img src="/logo.png" alt="CM" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="d-flex flex-column lh-1">
            <span className="fw-bold" style={{ fontSize: '1.05rem', fontFamily: 'Space Grotesk, sans-serif', color: 'var(--primary)', letterSpacing: '0.2px', textShadow: '0 2px 10px rgba(212, 175, 55, 0.3)' }}>Calcutta Machinery</span>
            <span style={{ fontSize: '0.65rem', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>GST Billing System</span>
          </div>
        </Link>

        <div className="d-none d-md-flex align-items-center ms-4 flex-grow-1">
          <div className="nav-links d-flex gap-1">
            <Link to="/" className="nav-link-custom">Dashboard</Link>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-decoration-none p-0" style={{ color: 'var(--text-muted)' }} data-bs-toggle="dropdown">
                Sales <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-dark" style={{ background: 'var(--navy-mid)', border: '1px solid var(--glass-border)' }}>
                <li><Link to="/invoices/create" className="dropdown-item"><i className="fas fa-plus-circle me-2" style={{ color: 'var(--primary)' }}></i>New Invoice</Link></li>
                <li><Link to="/invoices" className="dropdown-item"><i className="fas fa-file-invoice me-2" style={{ color: 'var(--primary)' }}></i>Invoices</Link></li>
                <li><Link to="/reports/sales" className="dropdown-item"><i className="fas fa-chart-bar me-2" style={{ color: 'var(--primary)' }}></i>Sales Report</Link></li>
              </ul>
            </div>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-decoration-none p-0" style={{ color: 'var(--text-muted)' }} data-bs-toggle="dropdown">
                Purchase <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-dark" style={{ background: 'var(--navy-mid)', border: '1px solid var(--glass-border)' }}>
                <li><Link to="/invoices/create?type=Purchase" className="dropdown-item"><i className="fas fa-shopping-cart me-2" style={{ color: 'var(--primary)' }}></i>New Purchase</Link></li>
                <li><Link to="/reports/purchases" className="dropdown-item"><i className="fas fa-chart-bar me-2" style={{ color: 'var(--primary)' }}></i>Purchase Report</Link></li>
              </ul>
            </div>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-decoration-none p-0" style={{ color: 'var(--text-muted)' }} data-bs-toggle="dropdown">
                Masters <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-dark" style={{ background: 'var(--navy-mid)', border: '1px solid var(--glass-border)' }}>
                <li><Link to="/parties" className="dropdown-item"><i className="fas fa-users me-2" style={{ color: 'var(--primary)' }}></i>Parties</Link></li>
                <li><Link to="/products" className="dropdown-item"><i className="fas fa-box me-2" style={{ color: 'var(--primary)' }}></i>Products</Link></li>
              </ul>
            </div>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-decoration-none p-0" style={{ color: 'var(--text-muted)' }} data-bs-toggle="dropdown">
                Reports <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-dark" style={{ background: 'var(--navy-mid)', border: '1px solid var(--glass-border)' }}>
                <li><Link to="/reports/gstr1" className="dropdown-item"><i className="fas fa-file-alt me-2" style={{ color: 'var(--primary)' }}></i>GSTR-1</Link></li>
                <li><Link to="/reports/gstr3b" className="dropdown-item"><i className="fas fa-file-alt me-2" style={{ color: 'var(--primary)' }}></i>GSTR-3B</Link></li>
                <li><Link to="/reports/outstanding" className="dropdown-item"><i className="fas fa-clock me-2" style={{ color: 'var(--primary)' }}></i>Outstanding</Link></li>
              </ul>
            </div>
            <Link to="/payments" className="nav-link-custom"><i className="fas fa-credit-card me-1"></i>Payments</Link>
          </div>
        </div>

        <div className="d-flex align-items-center ms-auto">
          {company && (
            <span className="company-badge d-none d-md-inline-block me-3">
              <i className="fas fa-building me-1"></i>{company.businessName || 'Business'}
            </span>
          )}
          <Link to="/company" className="btn" style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '8px 16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
            textTransform: 'uppercase'
          }}>
            <i className="fas fa-cog me-1"></i>Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

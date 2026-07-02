import React from 'react';
import { Link } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

const Navbar = ({ toggleSidebar }) => {
  const { company } = useCompany();

  return (
    <nav className="main-navbar navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
      <div className="container-fluid">
        <button className="btn btn-link sidebar-toggler d-lg-none me-2" onClick={toggleSidebar} type="button">
          <i className="fas fa-bars"></i>
        </button>
        <Link className="navbar-brand d-flex align-items-center" to="/" style={{ gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(233,69,96,0.2)',
            border: '2px solid rgba(233,69,96,0.15)'
          }}>
            <img src="/logo.png" alt="CM" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="d-flex flex-column lh-1">
            <span className="fw-bold" style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', color: '#1a1a2e' }}>Calcutta Machinery</span>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.8px', color: '#e94560', fontWeight: 600, textTransform: 'uppercase' }}>GST Billing System</span>
          </div>
        </Link>

        <div className="d-none d-md-flex align-items-center ms-4 flex-grow-1">
          <div className="nav-links d-flex gap-1">
            <Link to="/" className="nav-link-custom">Dashboard</Link>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-dark text-decoration-none p-0" data-bs-toggle="dropdown">
                Sales <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu">
                <li><Link to="/invoices/create" className="dropdown-item"><i className="fas fa-plus-circle me-2"></i>New Invoice</Link></li>
                <li><Link to="/invoices" className="dropdown-item"><i className="fas fa-file-invoice me-2"></i>Invoices</Link></li>
                <li><Link to="/reports/sales" className="dropdown-item"><i className="fas fa-chart-bar me-2"></i>Sales Report</Link></li>
              </ul>
            </div>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-dark text-decoration-none p-0" data-bs-toggle="dropdown">
                Purchase <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu">
                <li><Link to="/invoices/create?type=Purchase" className="dropdown-item"><i className="fas fa-shopping-cart me-2"></i>New Purchase</Link></li>
                <li><Link to="/reports/purchases" className="dropdown-item"><i className="fas fa-chart-bar me-2"></i>Purchase Report</Link></li>
              </ul>
            </div>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-dark text-decoration-none p-0" data-bs-toggle="dropdown">
                Masters <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu">
                <li><Link to="/parties" className="dropdown-item"><i className="fas fa-users me-2"></i>Parties</Link></li>
                <li><Link to="/products" className="dropdown-item"><i className="fas fa-box me-2"></i>Products</Link></li>
              </ul>
            </div>
            <div className="dropdown nav-link-custom">
              <button className="dropdown-toggle btn btn-link text-dark text-decoration-none p-0" data-bs-toggle="dropdown">
                Reports <i className="fas fa-chevron-down ms-1 small"></i>
              </button>
              <ul className="dropdown-menu">
                <li><Link to="/reports/gstr1" className="dropdown-item"><i className="fas fa-file-alt me-2"></i>GSTR-1</Link></li>
                <li><Link to="/reports/gstr3b" className="dropdown-item"><i className="fas fa-file-alt me-2"></i>GSTR-3B</Link></li>
                <li><Link to="/reports/outstanding" className="dropdown-item"><i className="fas fa-clock me-2"></i>Outstanding</Link></li>
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
            background: 'linear-gradient(135deg, #f8f9fc, #fff)',
            border: '1.5px solid rgba(0,0,0,0.06)',
            borderRadius: 10,
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.8rem',
            padding: '6px 14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <i className="fas fa-cog me-1"></i>Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

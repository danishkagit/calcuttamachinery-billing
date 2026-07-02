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
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <div className="brand-icon me-2">
            <img src="/logo.svg" alt="CM" />
          </div>
          <div className="d-flex flex-column lh-1">
            <span className="fw-bold" style={{ fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif' }}>Calcutta Machinery</span>
            <span className="text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>GST BILLING SYSTEM</span>
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
          <span className="company-badge d-none d-md-inline-block me-3">
            <i className="fas fa-industry me-1"></i>Calcutta Machinery
          </span>
          <Link to="/company" className="btn btn-outline-primary btn-sm">
            <i className="fas fa-cog me-1"></i>Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

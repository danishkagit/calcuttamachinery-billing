import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { company } = useCompany();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="main-navbar navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container-fluid navbar-inner">
        <div className="navbar-left">
          <button className="sidebar-toggler d-lg-none" onClick={toggleSidebar} type="button">
            <i className="fas fa-bars"></i>
          </button>
          <Link className="navbar-brand-wrap" to="/">
            <div className="navbar-brand-logo">
              <img src="/logo.png" alt="CM" />
            </div>
            <div className="navbar-brand-text">
              <span className="brand-title">Calcutta Machinery</span>
              <span className="brand-sub">GST Billing System</span>
            </div>
          </Link>
        </div>

        <div className="navbar-center d-none d-lg-flex">
          <Link to="/" className="nav-link-item">
            <i className="fas fa-th-large"></i>
            <span>Dashboard</span>
          </Link>
          <div className="nav-dropdown">
            <button className="nav-link-item nav-dropdown-toggle" data-bs-toggle="dropdown">
              <i className="fas fa-file-invoice"></i>
              <span>Sales</span>
              <i className="fas fa-chevron-down nav-arrow"></i>
            </button>
            <ul className="dropdown-menu">
              <li><Link to="/invoices/create" className="dropdown-item"><i className="fas fa-plus-circle"></i>New Invoice</Link></li>
              <li><Link to="/invoices" className="dropdown-item"><i className="fas fa-list"></i>Invoices</Link></li>
              <li><Link to="/reports/sales" className="dropdown-item"><i className="fas fa-chart-bar"></i>Sales Report</Link></li>
            </ul>
          </div>
          <div className="nav-dropdown">
            <button className="nav-link-item nav-dropdown-toggle" data-bs-toggle="dropdown">
              <i className="fas fa-shopping-cart"></i>
              <span>Purchase</span>
              <i className="fas fa-chevron-down nav-arrow"></i>
            </button>
            <ul className="dropdown-menu">
              <li><Link to="/invoices/create?type=Purchase" className="dropdown-item"><i className="fas fa-plus-circle"></i>New Purchase</Link></li>
              <li><Link to="/reports/purchases" className="dropdown-item"><i className="fas fa-chart-bar"></i>Purchase Report</Link></li>
            </ul>
          </div>
          <div className="nav-dropdown">
            <button className="nav-link-item nav-dropdown-toggle" data-bs-toggle="dropdown">
              <i className="fas fa-database"></i>
              <span>Masters</span>
              <i className="fas fa-chevron-down nav-arrow"></i>
            </button>
            <ul className="dropdown-menu">
              <li><Link to="/parties" className="dropdown-item"><i className="fas fa-users"></i>Parties</Link></li>
              <li><Link to="/products" className="dropdown-item"><i className="fas fa-box"></i>Products</Link></li>
            </ul>
          </div>
          <div className="nav-dropdown">
            <button className="nav-link-item nav-dropdown-toggle" data-bs-toggle="dropdown">
              <i className="fas fa-chart-pie"></i>
              <span>Reports</span>
              <i className="fas fa-chevron-down nav-arrow"></i>
            </button>
            <ul className="dropdown-menu">
              <li><Link to="/reports/gstr1" className="dropdown-item"><i className="fas fa-file-alt"></i>GSTR-1</Link></li>
              <li><Link to="/reports/gstr3b" className="dropdown-item"><i className="fas fa-file-alt"></i>GSTR-3B</Link></li>
              <li><Link to="/reports/outstanding" className="dropdown-item"><i className="fas fa-clock"></i>Outstanding</Link></li>
            </ul>
          </div>
          <Link to="/payments" className="nav-link-item">
            <i className="fas fa-credit-card"></i>
            <span>Payments</span>
          </Link>
        </div>

        <div className="navbar-right">
          {company && (
            <span className="company-badge">
              <i className="fas fa-building"></i>
              {company.businessName || 'Business'}
            </span>
          )}

          {user && (
            <div className="user-dropdown" ref={menuRef}>
              <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span className="user-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                <span className="user-name">{user.name?.split(' ')[0] || 'User'}</span>
                <i className="fas fa-chevron-down user-chevron"></i>
              </button>

              {userMenuOpen && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <div className="user-menu-name">{user.name}</div>
                    <div className="user-menu-email">{user.email}</div>
                  </div>
                  <div className="user-menu-body">
                    <Link to="/company" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                      <i className="fas fa-building"></i>Company Settings
                    </Link>
                    <button className="user-menu-item user-menu-logout" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i>Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Link to="/company" className="nav-settings">
            <i className="fas fa-cog"></i>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

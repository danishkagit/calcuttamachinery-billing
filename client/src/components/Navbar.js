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
    <nav className="main-navbar fixed-top">
      <div className="navbar-inner">
        <div className="navbar-left">
          <button className="sidebar-toggler" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
          <Link className="navbar-brand-wrap" to="/">
            <img src="/logo.png" alt="CM" className="navbar-brand-logo" />
            <div className="navbar-brand-text">
              <span className="brand-title">Calcutta Machinery</span>
              <span className="brand-sub">GST Billing</span>
            </div>
          </Link>
        </div>

        <div className="navbar-right">
          {company && (
            <span className="company-badge">
              <i className="fas fa-building me-1"></i>
              {company.businessName}
            </span>
          )}

          {user && (
            <div className="user-dropdown" ref={menuRef}>
              <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span className="user-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                <span className="user-name ms-1">{user.name?.split(' ')[0] || 'User'}</span>
                <i className="fas fa-chevron-down user-chevron ms-1"></i>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

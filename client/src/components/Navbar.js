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
      <div className="container-fluid">
        <button className="btn btn-link sidebar-toggler d-lg-none me-2" onClick={toggleSidebar} type="button">
          <i className="fas fa-bars"></i>
        </button>
        <Link className="navbar-brand d-flex align-items-center" to="/" style={{ gap: 12 }}>
          <div className="navbar-brand-logo">
            <img src="/logo.png" alt="CM" />
          </div>
          <div className="d-flex flex-column lh-1">
            <span className="brand-text">Calcutta Machinery</span>
            <span className="brand-subtext">GST Billing System</span>
          </div>
        </Link>

        <div className="d-none d-md-flex align-items-center ms-4 flex-grow-1">
          <div className="nav-links d-flex gap-1">
            <Link to="/" className="nav-link-custom"><i className="fas fa-th-large me-1"></i>Dashboard</Link>
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

        <div className="d-flex align-items-center ms-auto gap-3">
          {company && (
            <span className="company-badge d-none d-md-inline-block">
              <i className="fas fa-building me-1"></i>{company.businessName || 'Business'}
            </span>
          )}

          {user && (
            <div className="user-dropdown" ref={menuRef} style={{ position: 'relative' }}>
              <button
                className="user-avatar-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  color: 'var(--primary)',
                  padding: '6px 14px 6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0b0c10', fontWeight: 800, fontSize: '0.75rem'
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="d-none d-sm-inline">{user.name?.split(' ')[0] || 'User'}</span>
                <i className="fas fa-chevron-down" style={{ fontSize: '0.65rem', opacity: 0.7 }}></i>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'var(--navy-mid)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  minWidth: 200,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  zIndex: 1060,
                  overflow: 'hidden',
                  animation: 'scale-in 0.2s ease'
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <Link to="/company" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <i className="fas fa-building me-2"></i>Company Settings
                    </Link>
                    <button className="dropdown-item" onClick={handleLogout} style={{ color: '#ef4444', width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
                      <i className="fas fa-sign-out-alt me-2"></i>Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Link to="/company" className="settings-btn">
            <i className="fas fa-cog"></i>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

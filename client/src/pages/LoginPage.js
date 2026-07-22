import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      window.alert('Login successful!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
      window.alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-logo">
              <img src="/logo.png" alt="Calcutta Machinery" />
            </div>
            <h1 className="fw-bold mt-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>Calcutta Machinery</h1>
            <p className="mt-1 mb-0" style={{ fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600 }}>
              <i className="fas fa-industry me-2" style={{ color: 'var(--primary)' }}></i>
              MANUFACTURES & REPAIRS ALUMINIUM SLIVER CAN & THEIR ACCESSORIES
            </p>
            <p className="mt-3" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-leaf me-2" style={{ color: 'var(--primary)' }}></i>
              Professional GST billing & invoicing for aluminium sliver can manufacturing & repair.
            </p>
            <div className="auth-features mt-4">
              <div className="auth-feature">
                <i className="fas fa-check-circle me-2"></i>
                <span>GST Compliant Invoices</span>
              </div>
              <div className="auth-feature">
                <i className="fas fa-check-circle me-2"></i>
                <span>Auto GSTR-1 & GSTR-3B Reports</span>
              </div>
              <div className="auth-feature">
                <i className="fas fa-check-circle me-2"></i>
                <span>Party & Product Management</span>
              </div>
              <div className="auth-feature">
                <i className="fas fa-check-circle me-2"></i>
                <span>Payment Tracking & Outstanding</span>
              </div>
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <p className="mb-0" style={{ fontSize: '0.72rem', lineHeight: '1.5', color: 'var(--text-dim)' }}>
                <i className="fas fa-map-marker-alt me-1" style={{ color: 'var(--primary)' }}></i>
                <strong>Regd Off:</strong> 15, Dr. Noorie Lane No.1, Champdani, Baidyabati, Hooghly, WB-712222 &nbsp;
                <a href="https://maps.app.goo.gl/JScUieqZHGStKEUt6" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.68rem' }}>
                  <i className="fas fa-map-pin"></i> Map
                </a>
              </p>
              <p className="mb-0" style={{ fontSize: '0.72rem', lineHeight: '1.5', color: 'var(--text-dim)' }}>
                <i className="fas fa-industry me-1" style={{ color: 'var(--primary)' }}></i>
                <strong>Work:</strong> 09, R.B.S Road, Karahikal, Baidyabati, Hooghly, WB-712222 &nbsp;
                <a href="https://maps.app.goo.gl/pBSv9YcdENCvQktq8" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.68rem' }}>
                  <i className="fas fa-map-pin"></i> Map
                </a>
              </p>
              <p className="mb-0" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                <i className="fas fa-id-card me-1" style={{ color: 'var(--primary)' }}></i>
                GSTIN: 19ALUPS4733P1ZW
              </p>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-wrapper">
            <h3 className="fw-bold mb-1">Welcome Back</h3>
            <p className="mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to your billing dashboard</p>
            {error && (
              <div className="alert alert-danger py-2 small">{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-lock"></i></span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="remember" style={{ color: 'var(--text-muted)' }}>Remember me</label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</> : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-4 mb-0 small" style={{ color: 'var(--text-muted)' }}>
              Don't have an account? <Link to="/register" className="fw-semibold" style={{ color: 'var(--primary)' }}>Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

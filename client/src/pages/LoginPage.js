import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-wrapper">
          <div className="text-center mb-4">
            <img src="/logo.png" alt="Calcutta Machinery" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 12 }} />
            <h5 className="fw-bold mb-1">Calcutta Machinery</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sign in to your billing dashboard</p>
          </div>
          {error && (
            <div className="alert alert-danger py-2 small">{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small">Email Address</label>
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
            <div className="mb-4">
              <label className="form-label small">Password</label>
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
            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</> : 'Sign In'}
            </button>
          </form>
          <p className="text-center mt-3 mb-0 small" style={{ color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register" className="fw-semibold" style={{ color: 'var(--primary)' }}>Create Account</Link>
          </p>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            <div><i className="fas fa-id-card me-1"></i> GSTIN: 19ALUPS4733P1ZW</div>
            <div><i className="fas fa-map-marker-alt me-1"></i> 15, Dr. Noorie Lane No.1, Champdani, Baidyabati, WB-712222</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
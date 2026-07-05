import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, googleLogin, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, phone, password, confirmPassword } = form;
    if (!name || !email || !password) {
      setError('Name, email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, phone);
      window.alert('Account created successfully!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      setError(msg);
      window.alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      window.alert('Google authentication successful!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Google authentication failed.';
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
            <h1 className="fw-bold mt-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>Get Started</h1>
            <p className="mt-3" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <i className="fas fa-rocket me-2" style={{ color: 'var(--primary)' }}></i>
              Create your account and start managing GST billing for Calcutta Machinery.
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
                <i className="fas fa-industry me-1" style={{ color: 'var(--primary)' }}></i>
                Manufactures & Repairs Aluminium Sliver Can & Their Accessories
              </p>
              <p className="mb-0 mt-1" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                <i className="fas fa-map-marker-alt me-1" style={{ color: 'var(--primary)' }}></i>
                Regd: 15, Dr. Noorie Lane No.1, Champdani, Baidyabati, Hooghly, WB-712222
              </p>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-wrapper">
            <h3 className="fw-bold mb-1">Create Account</h3>
            <p className="mb-4" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fill in the details to register</p>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-user"></i></span>
                  <input type="text" name="name" className="form-control" placeholder="Your name" value={form.name} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Email *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                  <input type="email" name="email" className="form-control" placeholder="Your email" value={form.email} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-phone"></i></span>
                  <input type="text" name="phone" className="form-control" placeholder="Phone number" value={form.phone} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Password *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-lock"></i></span>
                  <input type="password" name="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label">Confirm Password *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-lock"></i></span>
                  <input type="password" name="confirmPassword" className="form-control" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : 'Create Account'}
              </button>
            </form>

            <div className="text-center my-3 text-muted position-relative">
              <hr style={{ borderColor: 'var(--glass-border)' }} />
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
            </div>

            <div className="d-flex justify-content-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  window.alert('Google Sign Up Failed');
                }}
                text="signup_with"
                theme="filled_black"
                shape="rectangular"
                width="100%"
              />
            </div>

            <p className="text-center mt-4 mb-0 small" style={{ color: 'var(--text-muted)' }}>
              Already have an account? <Link to="/login" className="fw-semibold" style={{ color: 'var(--primary)' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

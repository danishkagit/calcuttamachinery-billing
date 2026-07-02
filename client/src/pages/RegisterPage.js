import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, user } = useAuth();
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
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
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
              <img src="/logo.svg" alt="Calcutta Machinery" />
            </div>
            <h1 className="text-white fw-bold mt-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Get Started</h1>
            <p className="text-white-50 mt-2">Create your account and start managing your GST billing for Calcutta Machinery effortlessly.</p>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="mb-0 text-white-50" style={{ fontSize: '0.72rem', lineHeight: '1.5' }}>
                <i className="fas fa-industry me-1"></i>
                Manufacturer of Aluminium Sliver Cans for Jute & Twine Mills
              </p>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-wrapper">
            <h3 className="fw-bold mb-1">Create Account</h3>
            <p className="text-muted mb-4">Fill in the details to register</p>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Full Name *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-user"></i></span>
                  <input type="text" name="name" className="form-control" placeholder="Your name" value={form.name} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Email *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                  <input type="email" name="email" className="form-control" placeholder="Your email" value={form.email} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Phone</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-phone"></i></span>
                  <input type="text" name="phone" className="form-control" placeholder="Phone number" value={form.phone} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Password *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-lock"></i></span>
                  <input type="password" name="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold small">Confirm Password *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-lock"></i></span>
                  <input type="password" name="confirmPassword" className="form-control" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} disabled={loading} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : 'Create Account'}
              </button>
            </form>
            <p className="text-center mt-4 mb-0 small">
              Already have an account? <Link to="/login" className="fw-semibold" style={{ color: 'var(--primary)' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

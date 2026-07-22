import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Loading from '../components/Loading';

const LabourForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', hourlyRate: 0, dailyRate: 0, address: '', active: true
  });

  useEffect(() => {
    if (isEdit) fetchLabour();
  }, [id]);

  const fetchLabour = async () => {
    try {
      const res = await api.get(`/labour/${id}`);
      const l = res.data.data;
      setForm({
        name: l.name || '',
        phone: l.phone || '',
        hourlyRate: l.hourlyRate || 0,
        dailyRate: l.dailyRate || 0,
        address: l.address || '',
        active: l.active !== undefined ? l.active : true
      });
    } catch (err) {
      window.alert('Failed to load labour record');
      navigate('/labour');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      window.alert('Labour name is required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/labour/${id}`, form);
        window.alert('Labour record updated successfully');
      } else {
        await api.post('/labour', form);
        window.alert('Labour record created successfully');
      }
      navigate('/labour');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="labour-form-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">{isEdit ? 'Edit Labour Record' : 'Add New Labour'}</h4>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Labour Name *</label>
                <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Phone</label>
                <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Hourly Rate (₹)</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input type="number" className="form-control" name="hourlyRate" value={form.hourlyRate} onChange={handleChange} min={0} step={0.5} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Daily Rate (₹)</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input type="number" className="form-control" name="dailyRate" value={form.dailyRate} onChange={handleChange} min={0} step={0.5} />
                </div>
              </div>
              <div className="col-md-12">
                <label className="form-label fw-semibold small">Address</label>
                <textarea className="form-control" name="address" value={form.address} onChange={handleChange} rows={2} />
              </div>
              <div className="col-md-6">
                <div className="form-check mt-3">
                  <input type="checkbox" className="form-check-input" name="active" id="activeCheck" checked={form.active} onChange={handleChange} />
                  <label className="form-check-label fw-semibold small" htmlFor="activeCheck">Active</label>
                </div>
              </div>
            </div>

            <div className="text-end">
              <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/labour')}>Cancel</button>
              <button type="submit" className="btn btn-primary px-5" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : isEdit ? 'Update Labour' : 'Save Labour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LabourForm;

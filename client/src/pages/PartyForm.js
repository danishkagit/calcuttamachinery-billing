import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { INDIAN_STATES, getStateCode } from '../utils/helpers';
import Loading from '../components/Loading';

const PartyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [fetchingGstin, setFetchingGstin] = useState(false);
  const [form, setForm] = useState({
    partyType: 'Customer', name: '', companyName: '', gstin: '', mobile: '',
    email: '', address: '', city: '', state: '', pincode: '',
    billingAddress: '', shippingAddress: '', openingBalance: 0,
    creditLimit: 0, stateCode: 0
  });

  useEffect(() => {
    if (isEdit) {
      fetchParty();
    }
  }, [id]);

  const fetchParty = async () => {
    try {
      const res = await api.get(`/parties/${id}`);
      const p = res.data.data;
      setForm({
        partyType: p.partyType || 'Customer',
        name: p.name || '',
        companyName: p.companyName || '',
        gstin: p.gstin || '',
        mobile: p.mobile || '',
        email: p.email || '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        pincode: p.pincode || '',
        billingAddress: p.billingAddress || '',
        shippingAddress: p.shippingAddress || '',
        openingBalance: p.openingBalance || 0,
        creditLimit: p.creditLimit || 0,
        stateCode: p.stateCode || 0
      });
    } catch (err) {
      window.alert('Failed to load party');
      navigate('/parties');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { ...form, [name]: value };
    if (name === 'state') {
      updates.stateCode = getStateCode(value);
    }
    setForm(updates);
  };

  const fetchGstinDetails = async () => {
    const gstin = form.gstin?.trim();
    if (!gstin || gstin.length !== 15) {
      window.alert('Please enter a valid 15-digit GSTIN');
      return;
    }
    setFetchingGstin(true);
    try {
      const res = await api.get(`/gstin/${gstin}`);
      const data = res.data.data;
      setForm(prev => ({
        ...prev,
        stateCode: data.stateCode || prev.stateCode,
        state: data.stateName || prev.state,
      }));
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to fetch GSTIN details');
    } finally {
      setFetchingGstin(false);
    }
  };

  const copyBillingToShipping = () => {
    setForm({ ...form, shippingAddress: form.billingAddress || form.address });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      window.alert('Name and mobile are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/parties/${id}`, form);
        window.alert('Party updated successfully');
      } else {
        await api.post('/parties', form);
        window.alert('Party created successfully');
      }
      navigate('/parties');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to save party');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="party-form-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">{isEdit ? 'Edit Party' : 'Add New Party'}</h4>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-semibold small">Party Type</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="partyType" id="typeCustomer" value="Customer" checked={form.partyType === 'Customer'} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="typeCustomer">Customer</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="partyType" id="typeSupplier" value="Supplier" checked={form.partyType === 'Supplier'} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="typeSupplier">Supplier</label>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Name *</label>
                <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Company Name</label>
                <input type="text" className="form-control" name="companyName" value={form.companyName} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">GSTIN</label>
                <div className="input-group">
                  <input type="text" className="form-control" name="gstin" value={form.gstin} onChange={handleChange} maxLength={15} placeholder="Enter 15-digit GSTIN" />
                  <button type="button" className="btn btn-primary" onClick={fetchGstinDetails} disabled={fetchingGstin}>
                    {fetchingGstin ? <><span className="spinner-border spinner-border-sm me-1"></span>Fetching...</> : <><i className="fas fa-search me-1"></i>Fetch</>}
                  </button>
                </div>
                {form.gstin && form.gstin.length === 15 && (
                  <small className="text-muted">Click "Fetch" to auto-fill business details from GST portal</small>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Mobile *</label>
                <input type="text" className="form-control" name="mobile" value={form.mobile} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Email</label>
                <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Credit Limit</label>
                <input type="number" className="form-control" name="creditLimit" value={form.creditLimit} onChange={handleChange} min={0} />
              </div>
            </div>

            <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-map-marker-alt me-2"></i>Address</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-12">
                <label className="form-label fw-semibold small">Address</label>
                <textarea className="form-control" name="address" value={form.address} onChange={handleChange} rows={2}></textarea>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">City</label>
                <input type="text" className="form-control" name="city" value={form.city} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">State</label>
                <select className="form-select" name="state" value={form.state} onChange={handleChange}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s.code} value={s.name}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold small">State Code</label>
                <input type="text" className="form-control" value={form.stateCode} readOnly />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold small">Pincode</label>
                <input type="text" className="form-control" name="pincode" value={form.pincode} onChange={handleChange} />
              </div>
            </div>

            <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-truck me-2"></i>Billing & Shipping</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="d-flex justify-content-between">
                  <label className="form-label fw-semibold small">Billing Address</label>
                </div>
                <textarea className="form-control" name="billingAddress" value={form.billingAddress} onChange={handleChange} rows={2}></textarea>
              </div>
              <div className="col-md-6">
                <div className="d-flex justify-content-between">
                  <label className="form-label fw-semibold small">Shipping Address</label>
                  <button type="button" className="btn btn-sm btn-link p-0" onClick={copyBillingToShipping}><i className="fas fa-copy me-1"></i>Copy from billing</button>
                </div>
                <textarea className="form-control" name="shippingAddress" value={form.shippingAddress} onChange={handleChange} rows={2}></textarea>
              </div>
            </div>

            <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-coins me-2"></i>Financial</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Opening Balance</label>
                <input type="number" className="form-control" name="openingBalance" value={form.openingBalance} onChange={handleChange} />
              </div>
            </div>

            <div className="text-end">
              <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/parties')}>Cancel</button>
              <button type="submit" className="btn btn-primary px-5" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : isEdit ? 'Update Party' : 'Save Party'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartyForm;

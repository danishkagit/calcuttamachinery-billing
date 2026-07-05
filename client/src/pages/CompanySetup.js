import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { INDIAN_STATES, getStateCode } from '../utils/helpers';
import Loading from '../components/Loading';

const CompanySetup = () => {
  const { company, loading, createCompany, updateCompany } = useCompany();
  const [form, setForm] = useState({
    businessName: '', gstin: '', pan: '', address: '', city: '', state: '', pincode: '',
    mobile: '', email: '', bankName: '', accountNo: '', ifscCode: '',
    invoicePrefix: 'INV-', lastInvoiceNo: 1, stateCode: 0, logo: '', signature: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        businessName: company.businessName || '',
        gstin: company.gstin || '',
        pan: company.pan || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        pincode: company.pincode || '',
        mobile: company.mobile || '',
        email: company.email || '',
        bankName: company.bankName || '',
        accountNo: company.accountNo || '',
        ifscCode: company.ifscCode || '',
        invoicePrefix: company.invoicePrefix || 'INV-',
        lastInvoiceNo: company.lastInvoiceNo || 1,
        stateCode: company.stateCode || 0,
        logo: company.logo || '',
        signature: company.signature || ''
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { ...form, [name]: value };
    if (name === 'state') {
      updates.stateCode = getStateCode(value);
    }
    setForm(updates);
  };

  const handleFileUpload = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm({ ...form, [field]: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessName) {
      window.alert('Business name is required');
      return;
    }
    setSaving(true);
    try {
      if (company) {
        await updateCompany(form);
        window.alert('Company updated successfully');
      } else {
        await createCompany(form);
        window.alert('Company created successfully');
      }
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="company-setup-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">{company ? 'Company Profile' : 'Company Setup'}</h4>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-building me-2"></i>Business Information</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Business Name *</label>
                <input type="text" className="form-control" name="businessName" value={form.businessName} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">GSTIN</label>
                <input type="text" className="form-control" name="gstin" value={form.gstin} onChange={handleChange} maxLength={15} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">PAN</label>
                <input type="text" className="form-control" name="pan" value={form.pan} onChange={handleChange} maxLength={10} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Address</label>
                <textarea className="form-control" name="address" value={form.address} onChange={handleChange} rows={2}></textarea>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">City</label>
                <input type="text" className="form-control" name="city" value={form.city} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">State</label>
                <select className="form-select" name="state" value={form.state} onChange={handleChange}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => <option key={s.code} value={s.name}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold small">State Code</label>
                <input type="text" className="form-control" name="stateCode" value={form.stateCode} readOnly />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold small">Pincode</label>
                <input type="text" className="form-control" name="pincode" value={form.pincode} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Mobile</label>
                <input type="text" className="form-control" name="mobile" value={form.mobile} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Email</label>
                <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
              </div>
            </div>

            <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-university me-2"></i>Bank Details</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Bank Name</label>
                <input type="text" className="form-control" name="bankName" value={form.bankName} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Account Number</label>
                <input type="text" className="form-control" name="accountNo" value={form.accountNo} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">IFSC Code</label>
                <input type="text" className="form-control" name="ifscCode" value={form.ifscCode} onChange={handleChange} />
              </div>
            </div>

            <h6 className="fw-bold mb-3 text-primary"><i className="fas fa-cog me-2"></i>Invoice Settings</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Invoice Prefix</label>
                <input type="text" className="form-control" name="invoicePrefix" value={form.invoicePrefix} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Starting Invoice No.</label>
                <input type="number" className="form-control" name="lastInvoiceNo" value={form.lastInvoiceNo} onChange={handleChange} min={1} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Logo</label>
                <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload('logo')} />
                {form.logo && <img src={form.logo} alt="Logo" className="mt-2" style={{ maxHeight: '50px' }} />}
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Signature</label>
                <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload('signature')} />
                {form.signature && <img src={form.signature} alt="Signature" className="mt-2" style={{ maxHeight: '50px' }} />}
              </div>
            </div>

            <div className="text-end">
              <button type="submit" className="btn btn-primary px-5" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Company'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;

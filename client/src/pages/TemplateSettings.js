import React, { useState } from 'react';
import { toast } from 'react-toastify';

const TemplateSettings = () => {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    themeColor: '#d4a843',
    fontStyle: 'Outfit',
    showLogo: true,
    showSignature: true,
    showBankDetails: true,
    showTerms: true,
    footerText: 'Thank you for your business!'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast.success('Invoice template settings saved successfully!');
    }, 800);
  };

  return (
    <div className="template-settings-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Invoice Template Settings</h4>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-paint-brush me-2"></i>Appearance</h6>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Theme Color</label>
                    <div className="d-flex align-items-center gap-3">
                      <input type="color" className="form-control form-control-color bg-dark border-secondary" name="themeColor" value={settings.themeColor} onChange={handleChange} title="Choose your color" />
                      <span className="text-muted small">{settings.themeColor}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Font Style</label>
                    <select className="form-select" name="fontStyle" value={settings.fontStyle} onChange={handleChange}>
                      <option value="Outfit">Outfit (Modern)</option>
                      <option value="Space Grotesk">Space Grotesk (Futuristic)</option>
                      <option value="Inter">Inter (Clean)</option>
                      <option value="Roboto">Roboto (Standard)</option>
                    </select>
                  </div>
                </div>

                <hr className="my-4" style={{ borderColor: 'var(--glass-border)' }} />
                
                <h6 className="fw-bold mb-3"><i className="fas fa-toggle-on me-2"></i>Visibility Options</h6>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showLogo" name="showLogo" checked={settings.showLogo} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="showLogo">Show Company Logo</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showSignature" name="showSignature" checked={settings.showSignature} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="showSignature">Show Authorized Signature Line</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showBankDetails" name="showBankDetails" checked={settings.showBankDetails} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="showBankDetails">Show Bank Details</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showTerms" name="showTerms" checked={settings.showTerms} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="showTerms">Show Terms & Conditions</label>
                    </div>
                  </div>
                </div>

                <hr className="my-4" style={{ borderColor: 'var(--glass-border)' }} />

                <div className="mb-4">
                  <label className="form-label fw-semibold small">Footer Text / Thank You Message</label>
                  <input type="text" className="form-control" name="footerText" value={settings.footerText} onChange={handleChange} placeholder="e.g. Thank you for your business!" />
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <i className="fas fa-save me-2"></i>{saving ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-eye me-2"></i>Preview</h6>
            </div>
            <div className="card-body p-4 text-center">
              <div 
                className="preview-box border rounded p-4 mx-auto" 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: settings.themeColor,
                  borderTopWidth: '4px',
                  fontFamily: settings.fontStyle
                }}
              >
                {settings.showLogo && (
                  <div className="mb-3">
                    <i className="fas fa-building fa-2x" style={{ color: settings.themeColor }}></i>
                  </div>
                )}
                <h5 className="fw-bold mb-1" style={{ color: settings.themeColor }}>INVOICE</h5>
                <p className="small text-muted mb-4">#INV-2026-001</p>
                
                <div className="d-flex justify-content-between text-start small mb-3">
                  <div>
                    <strong>Billed To:</strong><br />
                    Customer Name
                  </div>
                  <div className="text-end">
                    <strong>Amount:</strong><br />
                    ₹ 1,500.00
                  </div>
                </div>
                
                {settings.showBankDetails && (
                  <div className="text-start small p-2 rounded mb-3" style={{ backgroundColor: 'rgba(212, 168, 67, 0.05)', border: '1px solid rgba(212, 168, 67, 0.2)' }}>
                    <strong>Bank Details:</strong><br/>
                    A/C No: XXXX-XXXX-1234
                  </div>
                )}

                {settings.showSignature && (
                  <div className="mt-4 pt-4 border-top text-end small">
                    <span className="text-muted">Authorized Signatory</span>
                  </div>
                )}
              </div>
              <div className="mt-3 small text-muted fst-italic">
                {settings.footerText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSettings;

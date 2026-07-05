import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import InvoiceTemplate from '../components/InvoiceTemplate';
import Loading from '../components/Loading';

const dummyInvoice = {
  invoiceNo: 'INV-001',
  invoiceDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  invoiceType: 'Tax Invoice',
  items: [
    { description: 'Sample Product A', hsnCode: '1234', quantity: 2, rate: 1000, taxableValue: 2000, cgst: 180, sgst: 180 },
    { description: 'Sample Service B', hsnCode: '5678', quantity: 1, rate: 500, taxableValue: 500, cgst: 45, sgst: 45 }
  ],
  subtotal: 2500,
  cgstTotal: 225,
  sgstTotal: 225,
  igstTotal: 0,
  grandTotal: 2950,
  amountInWords: 'Two Thousand Nine Hundred Fifty Only'
};

const dummyParty = {
  name: 'Customer Pvt Ltd',
  address: '456 Client Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  gstin: '27ABCDE1234F1Z5'
};

const FONT_OPTIONS = [
  { value: "'Inter', sans-serif", label: 'Inter (Modern)' },
  { value: "'Georgia', 'Times New Roman', serif", label: 'Georgia (Classic)' },
  { value: "'Segoe UI', sans-serif", label: 'Segoe UI (Clean)' },
  { value: "'Outfit', sans-serif", label: 'Outfit (Rounded)' },
  { value: "'Roboto', sans-serif", label: 'Roboto (Standard)' },
  { value: "'Playfair Display', serif", label: 'Playfair (Premium)' },
  { value: "'Courier New', monospace", label: 'Courier (Typewriter)' },
  { value: "Arial, sans-serif", label: 'Arial (Simple)' },
];

const SECTION_OPTIONS = [
  { key: 'showBank', label: 'Bank Details' },
  { key: 'showSignature', label: 'Signature & Signatory' },
  { key: 'showTransport', label: 'Transport / E-Way Bill' },
  { key: 'showTerms', label: 'Terms & Conditions' },
];

const TemplateSettings = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [customizing, setCustomizing] = useState(null);
  const [customForm, setCustomForm] = useState({});
  const [savingCustom, setSavingCustom] = useState(false);

  const templates = [
    { id: 'classic', name: 'Classic (Standard)' },
    { id: 'modern', name: 'Modern (Clean & Bold)' },
    { id: 'minimal', name: 'Minimal (Sleek)' },
    { id: 'professional', name: 'Professional (Navy)' },
    { id: 'elegant', name: 'Elegant (Premium)' },
    { id: 'corporate', name: 'Corporate (Blue)' },
    { id: 'retail', name: 'Retail (Compact)' },
    { id: 'tally', name: 'Tally ERP 9 (Tabular)' }
  ];

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await api.get('/company');
      setCompany(res.data.data);
    } catch (err) {
      toast.error('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (templateId) => {
    if (!company || !company._id) return;
    setSaving(templateId);
    try {
      const res = await api.put(`/company/${company._id}`, { defaultTemplate: templateId });
      setCompany(res.data.data);
      toast.success('Default template updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update default template');
    } finally {
      setSaving(null);
    }
  };

  const openCustomize = (tmpl) => {
    const existing = company?.templateSettings?.[tmpl.id] || {};
    setCustomForm({
      templateId: tmpl.id,
      accentColor: existing.accentColor || tmpl.defaultAccent || '#e94560',
      fontFamily: existing.fontFamily || "'Inter', sans-serif",
      showBank: existing.showBank !== false,
      showSignature: existing.showSignature !== false,
      showTransport: existing.showTransport !== false,
      showTerms: existing.showTerms !== false,
    });
    setCustomizing(tmpl);
  };

  const handleCustomChange = (field, value) => {
    setCustomForm(prev => ({ ...prev, [field]: value }));
  };

  const saveCustomization = async () => {
    if (!company || !company._id || !customizing) return;
    setSavingCustom(true);
    try {
      const currentSettings = { ...(company.templateSettings || {}) };
      currentSettings[customizing.id] = {
        accentColor: customForm.accentColor,
        fontFamily: customForm.fontFamily,
        showBank: customForm.showBank,
        showSignature: customForm.showSignature,
        showTransport: customForm.showTransport,
        showTerms: customForm.showTerms,
      };
      const res = await api.put(`/company/${company._id}`, { templateSettings: currentSettings });
      setCompany(res.data.data);
      toast.success('Template customization saved!');
      setCustomizing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customization');
    } finally {
      setSavingCustom(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="template-settings-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Invoice Templates Gallery</h4>
          <p className="text-muted small mb-0">Choose the default template for all your generated invoices. Click <strong>Customize</strong> to adjust colors, fonts, and visible sections.</p>
        </div>
      </div>

      <div className="row g-4">
        {templates.map(tmpl => {
          const isDefault = company?.defaultTemplate === tmpl.id || (!company?.defaultTemplate && tmpl.id === 'classic');
          
          return (
            <div className="col-lg-6" key={tmpl.id}>
              <div className={`card h-100 border-0 shadow-sm ${isDefault ? 'border-primary' : ''}`} style={isDefault ? { border: '2px solid var(--primary-color) !important', boxShadow: '0 0 15px rgba(212, 168, 67, 0.2)' } : {}}>
                <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center border-bottom-0">
                  <h6 className="fw-bold mb-0">
                    {isDefault && <i className="fas fa-check-circle text-primary me-2"></i>}
                    {tmpl.name}
                  </h6>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openCustomize(tmpl)}
                      title="Customize this template"
                    >
                      <i className="fas fa-palette me-1"></i>Customize
                    </button>
                    <button 
                      className={`btn btn-sm ${isDefault ? 'btn-success' : 'btn-outline-primary'}`}
                      disabled={isDefault || saving === tmpl.id}
                      onClick={() => handleSetDefault(tmpl.id)}
                    >
                      {saving === tmpl.id ? <span className="spinner-border spinner-border-sm"></span> : isDefault ? 'Current Default' : 'Set as Default'}
                    </button>
                  </div>
                </div>
                <div className="card-body p-3 bg-light">
                  <div 
                    className="template-preview-container bg-white shadow-sm border rounded"
                    style={{
                      height: '400px',
                      overflow: 'hidden',
                      position: 'relative',
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '181%', height: '181%' }}>
                      <InvoiceTemplate 
                        template={tmpl.id} 
                        invoice={dummyInvoice} 
                        company={company || { businessName: 'Your Company Name' }} 
                        party={dummyParty} 
                        templateSettings={company?.templateSettings || {}}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="card mt-5 border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0"><i className="fas fa-keyboard me-2 text-primary"></i>Keyboard Shortcuts</h5>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">New Invoice</span>
                <kbd className="bg-light text-dark border fw-bold px-2 py-1">Alt + N</kbd>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Save / Submit</span>
                <kbd className="bg-light text-dark border fw-bold px-2 py-1">Ctrl + S</kbd>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Print Invoice</span>
                <kbd className="bg-light text-dark border fw-bold px-2 py-1">Ctrl + P</kbd>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Dashboard</span>
                <kbd className="bg-light text-dark border fw-bold px-2 py-1">Alt + D</kbd>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Parties Master</span>
                <kbd className="bg-light text-dark border fw-bold px-2 py-1">Alt + P</kbd>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted">Products Master</span>
                <kbd className="bg-light text-dark border fw-bold px-2 py-1">Alt + I</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customize Modal */}
      {customizing && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-palette me-2"></i>
                  Customize: {customizing.name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setCustomizing(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-5">
                    <div className="bg-light rounded p-3" style={{ height: '300px', overflow: 'hidden' }}>
                      <div style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '222%', height: '222%' }}>
                        <InvoiceTemplate 
                          template={customizing.id} 
                          invoice={dummyInvoice} 
                          company={company || { businessName: 'Your Company Name', gstin: '27ABCDE1234F1Z5' }} 
                          party={dummyParty} 
                          templateSettings={{
                            [customizing.id]: {
                              accentColor: customForm.accentColor,
                              fontFamily: customForm.fontFamily,
                              showBank: customForm.showBank,
                              showSignature: customForm.showSignature,
                              showTransport: customForm.showTransport,
                              showTerms: customForm.showTerms,
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-7">
                    <h6 className="fw-bold mb-3">Style Settings</h6>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Accent / Primary Color</label>
                      <div className="d-flex align-items-center gap-2">
                        <input 
                          type="color" 
                          className="form-control form-control-color w-auto" 
                          value={customForm.accentColor}
                          onChange={(e) => handleCustomChange('accentColor', e.target.value)}
                          style={{ width: '60px', height: '38px', padding: '2px' }}
                        />
                        <input 
                          type="text" 
                          className="form-control" 
                          value={customForm.accentColor}
                          onChange={(e) => handleCustomChange('accentColor', e.target.value)}
                          style={{ width: '120px', fontFamily: 'monospace' }}
                        />
                        <div className="d-flex gap-1 flex-wrap">
                          {['#e94560', '#2563eb', '#10b981', '#c9a84c', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ef4444'].map(color => (
                            <button
                              key={color}
                              className="btn p-0 border"
                              style={{ width: '24px', height: '24px', background: color, borderRadius: '4px', border: customForm.accentColor === color ? '2px solid #000' : '1px solid #ddd' }}
                              onClick={() => handleCustomChange('accentColor', color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Font Family</label>
                      <select 
                        className="form-select" 
                        value={customForm.fontFamily}
                        onChange={(e) => handleCustomChange('fontFamily', e.target.value)}
                      >
                        {FONT_OPTIONS.map(f => (
                          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <h6 className="fw-bold mb-2 mt-4">Visible Sections</h6>
                    <div className="d-flex flex-column gap-2">
                      {SECTION_OPTIONS.map(sec => (
                        <div className="form-check form-switch" key={sec.key}>
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`sec-${sec.key}`}
                            checked={customForm[sec.key]}
                            onChange={(e) => handleCustomChange(sec.key, e.target.checked)}
                          />
                          <label className="form-check-label small" htmlFor={`sec-${sec.key}`}>{sec.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCustomizing(null)}>Cancel</button>
                <button type="button" className="btn btn-primary" disabled={savingCustom} onClick={saveCustomization}>
                  {savingCustom ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="fas fa-save me-1"></i>Save Customization</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSettings;

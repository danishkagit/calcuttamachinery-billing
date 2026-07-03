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

const TemplateSettings = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  
  const templates = [
    { id: 'classic', name: 'Classic (Standard)' },
    { id: 'modern', name: 'Modern (Clean & Bold)' },
    { id: 'minimal', name: 'Minimal (Sleek)' },
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

  if (loading) return <Loading />;

  return (
    <div className="template-settings-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Invoice Templates Gallery</h4>
          <p className="text-muted small mb-0">Choose the default template for all your generated invoices.</p>
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
                  <button 
                    className={`btn btn-sm ${isDefault ? 'btn-success' : 'btn-outline-primary'}`}
                    disabled={isDefault || saving === tmpl.id}
                    onClick={() => handleSetDefault(tmpl.id)}
                  >
                    {saving === tmpl.id ? <span className="spinner-border spinner-border-sm"></span> : isDefault ? 'Current Default' : 'Set as Default'}
                  </button>
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
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSettings;

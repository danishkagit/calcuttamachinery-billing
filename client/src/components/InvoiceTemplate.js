import React, { forwardRef } from 'react';
import { formatCurrency, formatDate, amountInWords } from '../utils/helpers';

const baseStyles = {
  classic: {
    headerBg: '#1a1a2e',
    headerText: '#fff',
    tableHeaderBg: '#1a1a2e',
    tableHeaderText: '#fff',
    accentColor: '#e94560',
    borderColor: '#e2e6f0',
    fontFamily: "'Inter', sans-serif",
  },
  modern: {
    headerBg: '#ffffff',
    headerText: '#1a1a2e',
    tableHeaderBg: '#f8f9fc',
    tableHeaderText: '#1a1a2e',
    accentColor: '#2563eb',
    borderColor: '#e2e6f0',
    fontFamily: "'Inter', sans-serif",
  },
  minimal: {
    headerBg: '#ffffff',
    headerText: '#1e293b',
    tableHeaderBg: '#f1f5f9',
    tableHeaderText: '#475569',
    accentColor: '#10b981',
    borderColor: '#e2e8f0',
    fontFamily: "'Inter', sans-serif",
  },
  professional: {
    headerBg: '#0c1a2b',
    headerText: '#ffffff',
    tableHeaderBg: '#0c1a2b',
    tableHeaderText: '#ffffff',
    accentColor: '#2563eb',
    borderColor: '#d1d5db',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    lightBg: '#f8fafc',
  },
  elegant: {
    headerBg: '#1a1225',
    headerText: '#ffffff',
    tableHeaderBg: '#2d1b4e',
    tableHeaderText: '#ffffff',
    accentColor: '#c9a84c',
    borderColor: '#e8dcc8',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    lightBg: '#fdfaf5',
  },
  corporate: {
    headerBg: '#1e3a5f',
    headerText: '#ffffff',
    tableHeaderBg: '#1e3a5f',
    tableHeaderText: '#ffffff',
    accentColor: '#3b82f6',
    borderColor: '#cbd5e1',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    lightBg: '#f8fafc',
  },
  retail: {
    headerBg: '#1a1a2e',
    headerText: '#ffffff',
    tableHeaderBg: '#e2e8f0',
    tableHeaderText: '#1e293b',
    accentColor: '#e94560',
    borderColor: '#d1d5db',
    fontFamily: "'Inter', sans-serif",
    lightBg: '#ffffff',
  },
  tally: {
    fontFamily: "Arial, sans-serif",
    borderColor: "#000",
    headerBg: "#fff",
    headerText: "#000",
    tableHeaderBg: "#fff",
    tableHeaderText: "#000",
    accentColor: "#000",
  },
  vibrant: {
    headerBg: 'linear-gradient(135deg, #FF6B35 0%, #E63946 100%)',
    headerText: '#ffffff',
    tableHeaderBg: '#FF6B35',
    tableHeaderText: '#ffffff',
    accentColor: '#E63946',
    borderColor: '#ffe0d6',
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    lightBg: '#fff8f6',
  },
  'classic-b2c': {
    headerBg: '#ffffff',
    headerText: '#1a1a1a',
    tableHeaderBg: '#f5f5f5',
    tableHeaderText: '#333333',
    accentColor: '#2196F3',
    borderColor: '#e0e0e0',
    fontFamily: "'Inter', sans-serif",
    lightBg: '#fafafa',
  },
  government: {
    headerBg: '#ffffff',
    headerText: '#000000',
    tableHeaderBg: '#f0f0f0',
    tableHeaderText: '#000000',
    accentColor: '#000000',
    borderColor: '#000000',
    fontFamily: "'Times New Roman', Times, serif",
    lightBg: '#ffffff',
  },
  international: {
    headerBg: '#003366',
    headerText: '#ffffff',
    tableHeaderBg: '#003366',
    tableHeaderText: '#ffffff',
    accentColor: '#003366',
    borderColor: '#b0c4de',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    lightBg: '#f0f4f8',
  },
  'e-commerce': {
    headerBg: '#ffffff',
    headerText: '#212121',
    tableHeaderBg: '#e3f2fd',
    tableHeaderText: '#1565C0',
    accentColor: '#1976D2',
    borderColor: '#bbdefb',
    fontFamily: "'Inter', sans-serif",
    lightBg: '#f8fbff',
  },
  compact: {
    headerBg: '#2d3748',
    headerText: '#ffffff',
    tableHeaderBg: '#2d3748',
    tableHeaderText: '#ffffff',
    accentColor: '#4a5568',
    borderColor: '#e2e8f0',
    fontFamily: "'Inter', sans-serif",
    lightBg: '#f7fafc',
  },
  boutique: {
    headerBg: '#1a0a00',
    headerText: '#C9A84C',
    tableHeaderBg: '#1a0a00',
    tableHeaderText: '#C9A84C',
    accentColor: '#C9A84C',
    borderColor: '#C9A84C',
    fontFamily: "'Georgia', 'Palatino Linotype', serif",
    lightBg: '#fffdf5',
  },
  thermal: {
    headerBg: '#ffffff',
    headerText: '#000000',
    tableHeaderBg: '#ffffff',
    tableHeaderText: '#000000',
    accentColor: '#000000',
    borderColor: '#000000',
    fontFamily: "'Courier New', Courier, monospace",
    lightBg: '#ffffff',
  },
  a5: {
    headerBg: '#1e3a5f',
    headerText: '#ffffff',
    tableHeaderBg: '#1e3a5f',
    tableHeaderText: '#ffffff',
    accentColor: '#3b82f6',
    borderColor: '#cbd5e1',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    lightBg: '#f8fafc',
  },
};

const mergeCustomStyles = (templateName, templateSettings) => {
  const base = { ...(baseStyles[templateName] || baseStyles.classic) };
  if (!templateSettings) return base;
  const custom = templateSettings[templateName];
  if (!custom) return base;
  if (custom.accentColor) base.accentColor = custom.accentColor;
  if (custom.fontFamily) base.fontFamily = custom.fontFamily;
  if (custom.headerBg) base.headerBg = custom.headerBg;
  if (custom.headerText) base.headerText = custom.headerText;
  if (custom.tableHeaderBg) base.tableHeaderBg = custom.tableHeaderBg;
  if (custom.tableHeaderText) base.tableHeaderText = custom.tableHeaderText;
  if (custom.borderColor) base.borderColor = custom.borderColor;
  return base;
};

const getDocumentTitle = (type) => {
  const titles = {
    'Tax Invoice': 'TAX INVOICE',
    'Bill of Supply': 'BILL OF SUPPLY',
    'Credit Note': 'CREDIT NOTE',
    'Debit Note': 'DEBIT NOTE',
    'Proforma Invoice': 'PROFORMA INVOICE',
    'Quotation': 'QUOTATION',
    'Delivery Challan': 'DELIVERY CHALLAN',
    'Purchase Order': 'PURCHASE ORDER',
  };
  return titles[type] || 'TAX INVOICE';
};

const InvoiceTemplate = forwardRef(({ invoice, company, party, template = 'classic', templateSettings }, ref) => {
  if (!invoice) return null;
  const s = mergeCustomStyles(template, templateSettings);

  const showSection = (key) => {
    if (!templateSettings || !templateSettings[template]) return true;
    const sectionSettings = templateSettings[template];
    if (key === 'bank' && sectionSettings.showBank === false) return false;
    if (key === 'signature' && sectionSettings.showSignature === false) return false;
    if (key === 'transport' && sectionSettings.showTransport === false) return false;
    if (key === 'terms' && sectionSettings.showTerms === false) return false;
    return true;
  };

  const renderItemRow = (item, index) => (
    <tr key={index}>
      <td className="text-center">{index + 1}</td>
      <td>{item.description || item.product?.name || ''}</td>
      <td>{item.product?.hsnCode || item.hsnCode || ''}</td>
      <td className="text-center">{item.quantity}</td>
      <td className="text-center">{item.unit || ''}</td>
      <td className="text-end">{formatCurrency(item.rate)}</td>
      <td className="text-end">{formatCurrency(item.taxableValue)}</td>
      {item.igst > 0 ? (
        <>
          <td className="text-end">-</td>
          <td className="text-end">-</td>
          <td className="text-end">{formatCurrency(item.igst)}</td>
        </>
      ) : (
        <>
          <td className="text-end">{formatCurrency(item.cgst)}</td>
          <td className="text-end">{formatCurrency(item.sgst)}</td>
          <td className="text-end">-</td>
        </>
      )}
      <td className="text-end fw-semibold">{formatCurrency(item.total)}</td>
    </tr>
  );

  const renderTaxSummary = () => (
    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
      <tbody>
        <tr><td style={{ padding: '4px 8px', fontWeight: 500 }}>Subtotal</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td></tr>
        {invoice.cgstTotal > 0 && <tr><td style={{ padding: '4px 8px', fontWeight: 500 }}>CGST</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(invoice.cgstTotal)}</td></tr>}
        {invoice.sgstTotal > 0 && <tr><td style={{ padding: '4px 8px', fontWeight: 500 }}>SGST</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(invoice.sgstTotal)}</td></tr>}
        {invoice.igstTotal > 0 && <tr><td style={{ padding: '4px 8px', fontWeight: 500 }}>IGST</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(invoice.igstTotal)}</td></tr>}
        {invoice.cessTotal > 0 && <tr><td style={{ padding: '4px 8px', fontWeight: 500 }}>Cess</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(invoice.cessTotal)}</td></tr>}
        {invoice.roundOff !== 0 && <tr><td style={{ padding: '4px 8px', fontWeight: 500 }}>Round Off</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatCurrency(invoice.roundOff)}</td></tr>}
        <tr style={{ borderTop: `2px solid ${s.accentColor}` }}>
          <td style={{ padding: '8px 8px', fontWeight: 700, fontSize: '1.1rem', color: s.accentColor }}>Grand Total</td>
          <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: s.accentColor }}>{formatCurrency(invoice.grandTotal || 0)}</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="invoice-template" ref={ref} style={{ fontFamily: s.fontFamily }}>
      {/* Template: Classic */}
      {template === 'classic' && (
        <>
          <div style={{ background: s.headerBg, color: s.headerText, padding: '30px', borderRadius: '12px 12px 0 0', marginBottom: '24px' }}>
            <div className="row align-items-center">
              <div className="col-8">
                <img src={company?.logo || '/logo.png'} alt="Logo" style={{ maxHeight: '60px', marginBottom: '8px' }} />
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: '4px' }}>{company?.businessName || 'Business Name'}</h2>
                <p style={{ opacity: 0.8, marginBottom: '2px', fontSize: '0.85rem' }}>{company?.address}{company?.address ? ', ' : ''}{company?.city || ''}</p>
                <p style={{ opacity: 0.8, marginBottom: 0, fontSize: '0.85rem' }}>{company?.state}{company?.state ? ' - ' : ''}{company?.pincode || ''}</p>
                <p style={{ opacity: 0.7, fontSize: '0.8rem', marginTop: '4px' }}>GSTIN: {company?.gstin || 'N/A'} | PAN: {company?.pan || 'N/A'}</p>
              </div>
              <div className="col-4 text-end">
                <div style={{ background: s.accentColor, color: '#fff', display: 'inline-block', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>
                  {getDocumentTitle(invoice.invoiceType)}
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4 px-3">
            <div className="col-6">
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 600, width: '120px', padding: '2px 0' }}>Invoice No:</td><td>{invoice.invoiceNo}</td></tr>
                  <tr><td style={{ fontWeight: 600, padding: '2px 0' }}>Date:</td><td>{formatDate(invoice.invoiceDate)}</td></tr>
                  <tr><td style={{ fontWeight: 600, padding: '2px 0' }}>Due Date:</td><td>{formatDate(invoice.dueDate)}</td></tr>
                  <tr><td style={{ fontWeight: 600, padding: '2px 0' }}>Place of Supply:</td><td>{invoice.placeOfSupply || party?.state || ''}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="col-6">
              <div style={{ background: '#f8f9fc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                <h6 style={{ fontWeight: 700, marginBottom: '8px', color: s.accentColor }}>Bill To:</h6>
                <p style={{ marginBottom: '2px', fontWeight: 600 }}>{party?.name || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.85rem' }}>{party?.address || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.85rem' }}>{party?.city}{party?.city && party?.state ? ', ' : ''}{party?.state || ''} - {party?.pincode || ''}</p>
                <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>GSTIN: {party?.gstin || 'N/A'} | Mobile: {party?.mobile || ''}</p>
              </div>
            </div>
          </div>

          <div className="px-3">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }} className="invoice-table">
              <thead>
                <tr style={{ background: s.tableHeaderBg, color: s.tableHeaderText }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '36px' }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>HSN/SAC</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Unit</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Taxable</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>CGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>SGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>IGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => renderItemRow(item, i))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: `2px solid ${s.accentColor}` }}>
                  <td colSpan="6" style={{ padding: '10px 12px', textAlign: 'right' }}>Total</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.cgstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.sgstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.igstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.grandTotal || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="row mt-3 px-3">
            <div className="col-7">
              <div style={{ background: '#f8f9fc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>Amount in Words:</p>
                <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>{invoice.amountInWords || amountInWords(invoice.grandTotal || 0)}</p>
              </div>
              {invoice.notes && (
                <div style={{ background: '#f8f9fc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}`, marginTop: '10px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Notes:</p>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="col-5">
              {renderTaxSummary()}
            </div>
          </div>

          <div className="row mt-3 px-3">
            <div className="col-6">
              {showSection('bank') && company?.bankName && (
                <div style={{ background: '#f8f9fc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                  <h6 style={{ fontWeight: 700, marginBottom: '6px', color: s.accentColor }}>Bank Details:</h6>
                  <p style={{ marginBottom: '2px', fontSize: '0.85rem' }}>Bank: {company.bankName}</p>
                  <p style={{ marginBottom: '2px', fontSize: '0.85rem' }}>Account: {company.accountNo}</p>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>IFSC: {company.ifscCode}</p>
                </div>
              )}
              {company?.upiId && company?.upiQrEnabled && (
                <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '10px' }}>
                  <h6 style={{ fontWeight: 700, marginBottom: '6px', color: '#16a34a' }}>Pay via UPI</h6>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>UPI ID: <strong>{company.upiId}</strong></p>
                  <div style={{ marginTop: 8 }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.businessName || '')}`} 
                         alt="UPI QR" style={{ width: 100, height: 100 }} />
                  </div>
                </div>
              )}
            </div>
            <div className="col-6">
              {showSection('terms') && invoice.termsAndConditions && (
                <div style={{ background: '#f8f9fc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                  <h6 style={{ fontWeight: 700, marginBottom: '6px', color: s.accentColor }}>Terms & Conditions:</h6>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="row mt-4 px-3">
            <div className="col-6">
              {showSection('transport') && invoice.transportMode && (
                <div style={{ fontSize: '0.8rem' }}>
                  <p style={{ marginBottom: '2px' }}>Transport: {invoice.transportMode} | Vehicle: {invoice.vehicleNo || ''}</p>
                  {invoice.eWayBillNo && <p style={{ marginBottom: 0 }}>E-Way Bill: {invoice.eWayBillNo} | {invoice.transportName || ''}</p>}
                </div>
              )}
            </div>
            <div className="col-6 text-end">
              {showSection('signature') && company?.signature && <img src={company.signature} alt="Signature" style={{ maxHeight: '50px', marginBottom: '4px' }} />}
              {showSection('signature') && <p style={{ fontWeight: 600, marginBottom: 0 }}>Authorised Signatory</p>}
              {showSection('signature') && <p style={{ fontSize: '0.8rem', marginBottom: 0 }}>For {company?.businessName || ''}</p>}
            </div>
          </div>
        </>
      )}

      {/* Template: Modern */}
      {template === 'modern' && (
        <>
          <div style={{ borderBottom: `3px solid ${s.accentColor}`, padding: '24px 24px 16px', marginBottom: '20px' }}>
            <div className="row align-items-center">
              <div className="col-7">
                <img src={company?.logo || '/logo.png'} alt="Logo" style={{ maxHeight: '50px', marginBottom: '8px' }} />
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: s.headerText, marginBottom: '2px' }}>{company?.businessName || 'Business Name'}</h2>
                <p style={{ color: '#64748b', marginBottom: '2px', fontSize: '0.85rem' }}>{company?.address}{company?.address ? ', ' : ''}{company?.city || ''}</p>
                <p style={{ color: '#64748b', marginBottom: 0, fontSize: '0.82rem' }}>GSTIN: {company?.gstin || 'N/A'} | {company?.email || ''}</p>
              </div>
              <div className="col-5 text-end">
                <div style={{ color: s.accentColor, fontWeight: 700, fontSize: '1.5rem', letterSpacing: '1px' }}>
                  {getDocumentTitle(invoice.invoiceType)}
                </div>
                <div style={{ background: s.accentColor, color: '#fff', padding: '2px 12px', borderRadius: '4px', display: 'inline-block', fontSize: '0.8rem', marginTop: '4px' }}>
                  {invoice.invoiceNo}
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4" style={{ padding: '0 24px' }}>
            <div className="col-6">
              <div style={{ fontSize: '0.85rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Details</p>
                <p style={{ marginBottom: '2px' }}><span style={{ color: '#64748b' }}>Date:</span> {formatDate(invoice.invoiceDate)}</p>
                <p style={{ marginBottom: '2px' }}><span style={{ color: '#64748b' }}>Due Date:</span> {formatDate(invoice.dueDate)}</p>
                <p style={{ marginBottom: 0 }}><span style={{ color: '#64748b' }}>Place of Supply:</span> {invoice.placeOfSupply || party?.state || ''}</p>
              </div>
            </div>
            <div className="col-6">
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                <p style={{ fontWeight: 600, marginBottom: '6px', color: s.accentColor }}>Bill To:</p>
                <p style={{ marginBottom: '2px', fontWeight: 600 }}>{party?.name || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.85rem', color: '#64748b' }}>{party?.address || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.85rem', color: '#64748b' }}>{party?.city}{party?.city && party?.state ? ', ' : ''}{party?.state || ''} - {party?.pincode || ''}</p>
                <p style={{ marginBottom: 0, fontSize: '0.85rem', color: '#64748b' }}>GSTIN: {party?.gstin || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: s.tableHeaderBg, color: s.tableHeaderText, borderBottom: `2px solid ${s.accentColor}` }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '30px' }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Taxable</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tax</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${s.borderColor}` }}>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontWeight: 500 }}>{item.description || item.product?.name || ''}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>HSN: {item.product?.hsnCode || item.hsnCode || ''}</div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity} {item.unit || ''}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.taxableValue)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0))}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row mt-3" style={{ padding: '0 24px' }}>
            <div className="col-7">
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Amount in Words:</p>
                <p style={{ marginBottom: 0 }}>{invoice.amountInWords || amountInWords(invoice.grandTotal || 0)}</p>
              </div>
              {invoice.notes && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginTop: '10px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Notes:</p>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem', color: '#64748b' }}>{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="col-5">
              <div style={{ border: `1px solid ${s.borderColor}`, borderRadius: '8px', padding: '14px' }}>
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr><td style={{ padding: '3px 0', color: '#64748b' }}>Subtotal</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td></tr>
                    {invoice.cgstTotal > 0 && <tr><td style={{ padding: '3px 0', color: '#64748b' }}>CGST</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.cgstTotal)}</td></tr>}
                    {invoice.sgstTotal > 0 && <tr><td style={{ padding: '3px 0', color: '#64748b' }}>SGST</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.sgstTotal)}</td></tr>}
                    {invoice.igstTotal > 0 && <tr><td style={{ padding: '3px 0', color: '#64748b' }}>IGST</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.igstTotal)}</td></tr>}
                    {invoice.roundOff !== 0 && <tr><td style={{ padding: '3px 0', color: '#64748b' }}>Round Off</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.roundOff)}</td></tr>}
                    <tr><td colSpan="2" style={{ borderTop: `2px solid ${s.accentColor}`, padding: '0' }}></td></tr>
                    <tr>
                      <td style={{ padding: '6px 0', fontWeight: 700, fontSize: '1rem', color: s.accentColor }}>Grand Total</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: s.accentColor }}>{formatCurrency(invoice.grandTotal || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 20px', marginTop: '24px', borderTop: `1px solid ${s.borderColor}`, paddingTop: '12px' }}>
            <div className="row">
              <div className="col-6">
                {showSection('bank') && company?.bankName && (
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Bank: {company.bankName} | A/c: {company.accountNo} | IFSC: {company.ifscCode}</p>
                )}
                {showSection('terms') && invoice.termsAndConditions && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{invoice.termsAndConditions}</p>}
              </div>
              <div className="col-6 text-end">
                {showSection('signature') && <p style={{ fontWeight: 600, marginBottom: 0 }}>For {company?.businessName || ''}</p>}
                {showSection('signature') && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Authorised Signatory</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Template: Minimal */}
      {template === 'minimal' && (
        <>
          <div style={{ textAlign: 'center', padding: '20px 20px 10px', borderBottom: `2px solid ${s.accentColor}`, marginBottom: '20px' }}>
            <img src={company?.logo || '/logo.png'} alt="Logo" style={{ maxHeight: '50px', marginBottom: '8px' }} />
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: s.headerText, marginBottom: '4px', fontSize: '1.5rem' }}>{company?.businessName || 'Business Name'}</h2>
            <p style={{ color: '#64748b', marginBottom: '2px', fontSize: '0.82rem' }}>{company?.address}{company?.address ? ', ' : ''}{company?.city || ''}</p>
            <p style={{ color: '#64748b', marginBottom: '2px', fontSize: '0.8rem' }}>GSTIN: {company?.gstin || 'N/A'}</p>
            <div style={{ color: s.accentColor, fontWeight: 700, fontSize: '1.2rem', letterSpacing: '2px', marginTop: '6px' }}>
              {getDocumentTitle(invoice.invoiceType)}
            </div>
          </div>

          <div style={{ padding: '0 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <div>
              <p style={{ margin: '0 0 2px' }}><strong>{party?.name || ''}</strong></p>
              <p style={{ margin: '0 0 2px', color: '#64748b' }}>{party?.address || ''}</p>
              <p style={{ margin: '0 0 2px', color: '#64748b' }}>{party?.city}{party?.city && party?.state ? ', ' : ''}{party?.state || ''}</p>
              <p style={{ margin: 0, color: '#64748b' }}>GSTIN: {party?.gstin || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px' }}><span style={{ color: '#64748b' }}>Invoice:</span> {invoice.invoiceNo}</p>
              <p style={{ margin: '0 0 2px' }}><span style={{ color: '#64748b' }}>Date:</span> {formatDate(invoice.invoiceDate)}</p>
              <p style={{ margin: 0 }}><span style={{ color: '#64748b' }}>Due:</span> {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div style={{ padding: '0 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: s.tableHeaderBg, color: s.tableHeaderText, borderBottom: `2px solid ${s.accentColor}` }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '30px' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${s.borderColor}` }}>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <div>{item.description || item.product?.name || ''}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>HSN: {item.product?.hsnCode || item.hsnCode || ''}</div>
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>{item.quantity} {item.unit || ''}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.taxableValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '0 20px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '280px', fontSize: '0.85rem' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr><td style={{ padding: '3px 0', color: '#64748b' }}>Subtotal</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td></tr>
                  {invoice.cgstTotal > 0 && <tr><td style={{ padding: '3px 0', color: '#64748b' }}>CGST</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.cgstTotal)}</td></tr>}
                  {invoice.sgstTotal > 0 && <tr><td style={{ padding: '3px 0', color: '#64748b' }}>SGST</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.sgstTotal)}</td></tr>}
                  {invoice.igstTotal > 0 && <tr><td style={{ padding: '3px 0', color: '#64748b' }}>IGST</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.igstTotal)}</td></tr>}
                  <tr><td colSpan="2" style={{ borderTop: `2px solid ${s.accentColor}`, padding: '0' }}></td></tr>
                  <tr>
                    <td style={{ padding: '6px 0', fontWeight: 700, fontSize: '1rem', color: s.accentColor }}>Grand Total</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: s.accentColor }}>{formatCurrency(invoice.grandTotal || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ padding: '10px 20px 0', marginTop: '16px', borderTop: `1px solid ${s.borderColor}`, fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {invoice.amountInWords && <p style={{ margin: '4px 0', fontWeight: 500, color: '#1e293b' }}>{invoice.amountInWords}</p>}
              {invoice.notes && <p style={{ margin: '4px 0' }}>{invoice.notes}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              {showSection('signature') && <p style={{ margin: '4px 0', fontWeight: 600, color: '#1e293b' }}>For {company?.businessName || ''}</p>}
              {showSection('signature') && <p style={{ margin: 0 }}>Authorised Signatory</p>}
            </div>
          </div>
        </>
      )}

      {/* Template: Professional */}
      {template === 'professional' && (
        <>
          <div style={{ background: s.headerBg, color: s.headerText, padding: '28px 30px', marginBottom: '22px' }}>
            <div className="row align-items-center">
              <div className="col-8">
                <img src={company?.logo || '/logo.png'} alt="Logo" style={{ maxHeight: '55px', marginBottom: '6px' }} />
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: '2px', fontSize: '1.4rem' }}>{company?.businessName || 'Business Name'}</h2>
                <p style={{ opacity: 0.85, marginBottom: '1px', fontSize: '0.82rem' }}>{company?.address}{company?.address ? ', ' : ''}{company?.city || ''}</p>
                <p style={{ opacity: 0.85, marginBottom: 0, fontSize: '0.82rem' }}>{company?.state}{company?.state ? ' - ' : ''}{company?.pincode || ''} | GSTIN: {company?.gstin || 'N/A'}</p>
              </div>
              <div className="col-4 text-end">
                <div style={{ background: s.accentColor, color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 700, fontSize: '1rem', letterSpacing: '1px', display: 'inline-block' }}>
                  {getDocumentTitle(invoice.invoiceType)}
                </div>
                <p style={{ marginTop: '6px', fontSize: '0.85rem', opacity: 0.85 }}><strong>{invoice.invoiceNo}</strong></p>
              </div>
            </div>
          </div>

          <div className="row mb-4" style={{ padding: '0 24px' }}>
            <div className="col-6">
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 600, width: '100px', padding: '3px 0', color: '#64748b' }}>Date:</td><td>{formatDate(invoice.invoiceDate)}</td></tr>
                  <tr><td style={{ fontWeight: 600, padding: '3px 0', color: '#64748b' }}>Due Date:</td><td>{formatDate(invoice.dueDate)}</td></tr>
                  <tr><td style={{ fontWeight: 600, padding: '3px 0', color: '#64748b' }}>Place of Supply:</td><td>{invoice.placeOfSupply || party?.state || ''}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="col-6">
              <div style={{ background: s.lightBg || '#f8fafc', padding: '12px', borderRadius: '6px', borderLeft: `3px solid ${s.accentColor}` }}>
                <h6 style={{ fontWeight: 700, marginBottom: '6px', color: s.accentColor, fontSize: '0.85rem' }}>Bill To:</h6>
                <p style={{ marginBottom: '2px', fontWeight: 600 }}>{party?.name || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.85rem', color: '#475569' }}>{party?.address || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.85rem', color: '#475569' }}>{party?.city}{party?.city && party?.state ? ', ' : ''}{party?.state || ''} - {party?.pincode || ''}</p>
                <p style={{ marginBottom: 0, fontSize: '0.85rem', color: '#475569' }}>GSTIN: {party?.gstin || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: s.tableHeaderBg, color: s.tableHeaderText }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '30px' }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>HSN/SAC</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Unit</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Taxable</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>CGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>SGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>IGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => renderItemRow(item, i))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: `2px solid ${s.accentColor}`, background: '#f8fafc' }}>
                  <td colSpan="6" style={{ padding: '10px 12px', textAlign: 'right' }}>Total</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.cgstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.sgstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.igstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.grandTotal || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="row mt-3" style={{ padding: '0 24px' }}>
            <div className="col-7">
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Amount in Words:</p>
                <p style={{ marginBottom: 0 }}>{invoice.amountInWords || amountInWords(invoice.grandTotal || 0)}</p>
              </div>
              {invoice.notes && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', marginTop: '8px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Notes:</p>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem', color: '#475569' }}>{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="col-5">
              <div style={{ border: `1px solid ${s.borderColor}`, borderRadius: '6px', padding: '12px' }}>
                {renderTaxSummary()}
              </div>
            </div>
          </div>

          <div className="row mt-4" style={{ padding: '0 24px' }}>
            <div className="col-6">
              {showSection('bank') && company?.bankName && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: `1px solid ${s.borderColor}` }}>
                  <h6 style={{ fontWeight: 700, marginBottom: '4px', color: s.accentColor, fontSize: '0.85rem' }}>Bank Details:</h6>
                  <p style={{ marginBottom: '2px', fontSize: '0.82rem' }}>{company.bankName} | A/c: {company.accountNo}</p>
                  <p style={{ marginBottom: 0, fontSize: '0.82rem' }}>IFSC: {company.ifscCode}</p>
                </div>
              )}
              {showSection('transport') && invoice.transportMode && (
                <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                  <p style={{ marginBottom: '2px' }}>Transport: {invoice.transportMode} | Vehicle: {invoice.vehicleNo || ''}</p>
                  {invoice.eWayBillNo && <p style={{ marginBottom: 0 }}>E-Way Bill: {invoice.eWayBillNo}</p>}
                </div>
              )}
            </div>
            <div className="col-6 text-end">
              {showSection('terms') && invoice.termsAndConditions && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: `1px solid ${s.borderColor}`, marginBottom: '8px', textAlign: 'left' }}>
                  <h6 style={{ fontWeight: 700, marginBottom: '4px', color: s.accentColor, fontSize: '0.85rem' }}>Terms:</h6>
                  <p style={{ marginBottom: 0, fontSize: '0.82rem' }}>{invoice.termsAndConditions}</p>
                </div>
              )}
              {showSection('signature') && <div style={{ marginTop: '8px' }}>
                {company?.signature && <img src={company.signature} alt="Signature" style={{ maxHeight: '45px', marginBottom: '2px' }} />}
                <p style={{ fontWeight: 600, marginBottom: 0 }}>Authorised Signatory</p>
                <p style={{ fontSize: '0.8rem', marginBottom: 0, color: '#64748b' }}>For {company?.businessName || ''}</p>
              </div>}
            </div>
          </div>
        </>
      )}

      {/* Template: Elegant */}
      {template === 'elegant' && (
        <>
          <div style={{ display: 'flex', marginBottom: '24px' }}>
            <div style={{ width: '40%', background: s.headerBg, color: s.headerText, padding: '28px 20px', borderRadius: '12px 0 0 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <img src={company?.logo || '/logo.png'} alt="Logo" style={{ maxHeight: '55px', marginBottom: '10px', filter: 'brightness(0) invert(1)' }} />
              <h2 style={{ fontFamily: "'Georgia', serif", fontWeight: 700, marginBottom: '6px', fontSize: '1.3rem', lineHeight: 1.3 }}>{company?.businessName || 'Business Name'}</h2>
              <p style={{ opacity: 0.8, marginBottom: '2px', fontSize: '0.8rem', lineHeight: 1.4 }}>{company?.address}{company?.address ? ', ' : ''}{company?.city || ''}</p>
              <p style={{ opacity: 0.8, marginBottom: '2px', fontSize: '0.8rem' }}>{company?.state}{company?.state ? ' - ' : ''}{company?.pincode || ''}</p>
              <p style={{ opacity: 0.7, fontSize: '0.78rem', marginTop: '4px' }}>GSTIN: {company?.gstin || 'N/A'}</p>
              {company?.email && <p style={{ opacity: 0.7, fontSize: '0.78rem', marginBottom: 0 }}>{company.email}</p>}
            </div>
            <div style={{ width: '60%', background: s.lightBg || '#fdfaf5', padding: '28px 24px', borderRadius: '0 12px 12px 0', border: `1px solid ${s.borderColor}`, borderLeft: 'none' }}>
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <div style={{ color: s.accentColor, fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: '1.6rem', letterSpacing: '1px', marginBottom: '4px' }}>
                  {getDocumentTitle(invoice.invoiceType)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  <p style={{ marginBottom: '2px' }}>No: <strong>{invoice.invoiceNo}</strong></p>
                  <p style={{ marginBottom: '2px' }}>Date: <strong>{formatDate(invoice.invoiceDate)}</strong></p>
                  <p style={{ marginBottom: 0 }}>Due: <strong>{formatDate(invoice.dueDate)}</strong></p>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${s.accentColor}`, paddingTop: '12px' }}>
                <h6 style={{ fontFamily: "'Georgia', serif", fontWeight: 700, marginBottom: '6px', color: s.accentColor, fontSize: '0.9rem' }}>Bill To:</h6>
                <p style={{ marginBottom: '2px', fontWeight: 600, fontSize: '0.9rem' }}>{party?.name || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.82rem', color: '#555' }}>{party?.address || ''}</p>
                <p style={{ marginBottom: '2px', fontSize: '0.82rem', color: '#555' }}>{party?.city}{party?.city && party?.state ? ', ' : ''}{party?.state || ''} - {party?.pincode || ''}</p>
                <p style={{ marginBottom: 0, fontSize: '0.82rem', color: '#555' }}>GSTIN: {party?.gstin || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: s.headerBg, color: s.headerText }}>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '32px' }}>#</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>HSN/SAC</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Taxable</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>CGST</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>SGST</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>IGST</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${s.borderColor}` }}>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '8px 14px' }}>{item.description || item.product?.name || ''}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>{item.product?.hsnCode || item.hsnCode || ''}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>{item.quantity} {item.unit || ''}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>{formatCurrency(item.taxableValue)}</td>
                    {item.igst > 0 ? (
                      <>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>{formatCurrency(item.igst)}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>{formatCurrency(item.cgst)}</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>{formatCurrency(item.sgst)}</td>
                        <td style={{ padding: '8px 14px', textAlign: 'right' }}>-</td>
                      </>
                    )}
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row mt-3" style={{ padding: '0 4px' }}>
            <div className="col-7">
              <div style={{ background: s.lightBg || '#fdfaf5', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Amount in Words:</p>
                <p style={{ marginBottom: 0, fontStyle: 'italic' }}>{invoice.amountInWords || amountInWords(invoice.grandTotal || 0)}</p>
              </div>
              {invoice.notes && (
                <div style={{ padding: '10px 0', fontSize: '0.82rem', color: '#555' }}>
                  <p style={{ marginBottom: '2px', fontWeight: 600 }}>Notes:</p>
                  <p style={{ marginBottom: 0 }}>{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="col-5">
              <div style={{ border: `1px solid ${s.borderColor}`, borderRadius: '8px', padding: '12px', background: s.lightBg || '#fdfaf5' }}>
                {renderTaxSummary()}
              </div>
            </div>
          </div>

          <div className="row mt-3" style={{ padding: '0 4px' }}>
            <div className="col-6">
              {showSection('bank') && company?.bankName && (
                <div style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
                  <h6 style={{ fontFamily: "'Georgia', serif", fontWeight: 700, marginBottom: '4px', color: s.accentColor }}>Bank Details</h6>
                  <p style={{ marginBottom: '2px' }}>{company.bankName}</p>
                  <p style={{ marginBottom: '2px' }}>A/c: {company.accountNo} | IFSC: {company.ifscCode}</p>
                </div>
              )}
              {showSection('transport') && invoice.transportMode && (
                <div style={{ fontSize: '0.8rem' }}>
                  <p style={{ marginBottom: '2px' }}>Transport: {invoice.transportMode} | Vehicle: {invoice.vehicleNo || ''}</p>
                  {invoice.eWayBillNo && <p style={{ marginBottom: 0 }}>E-Way Bill: {invoice.eWayBillNo}</p>}
                </div>
              )}
            </div>
            <div className="col-6 text-end">
              {showSection('terms') && invoice.termsAndConditions && (
                <div style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
                  <h6 style={{ fontFamily: "'Georgia', serif", fontWeight: 700, marginBottom: '4px', color: s.accentColor }}>Terms</h6>
                  <p style={{ marginBottom: 0 }}>{invoice.termsAndConditions}</p>
                </div>
              )}
              {showSection('signature') && <div style={{ marginTop: '4px' }}>
                {company?.signature && <img src={company.signature} alt="Signature" style={{ maxHeight: '45px', marginBottom: '2px' }} />}
                <p style={{ fontWeight: 600, marginBottom: 0, fontFamily: "'Georgia', serif" }}>Authorised Signatory</p>
                <p style={{ fontSize: '0.8rem', marginBottom: 0, color: '#666' }}>For {company?.businessName || ''}</p>
              </div>}
            </div>
          </div>
        </>
      )}

      {/* Template: Corporate */}
      {template === 'corporate' && (
        <>
          <div style={{ background: s.headerBg, color: s.headerText, padding: '24px 30px' }}>
            <div className="row align-items-center">
              <div className="col-7">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {company?.logo && <img src={company.logo} alt="Logo" style={{ maxHeight: '50px', maxWidth: '50px' }} />}
                  <div>
                    <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, marginBottom: '2px', fontSize: '1.3rem', letterSpacing: '0.5px' }}>{company?.businessName || 'Business Name'}</h2>
                    <p style={{ opacity: 0.8, marginBottom: 0, fontSize: '0.78rem' }}>{company?.address}{company?.address ? ', ' : ''}{company?.city || ''} - {company?.pincode || ''}</p>
                    <p style={{ opacity: 0.7, marginBottom: 0, fontSize: '0.75rem' }}>GSTIN: {company?.gstin || 'N/A'} | PAN: {company?.pan || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="col-5 text-end">
                <div style={{ background: 'rgba(255,255,255,0.12)', padding: '8px 16px', borderRadius: '4px', display: 'inline-block' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '1px' }}>{getDocumentTitle(invoice.invoiceType)}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '2px' }}>{invoice.invoiceNo}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            <div className="row" style={{ marginTop: '20px', marginBottom: '20px' }}>
              <div className="col-6">
                <div style={{ border: `1px solid ${s.borderColor}`, padding: '12px 14px', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: s.accentColor, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bill To</p>
                  <p style={{ marginBottom: '2px', fontWeight: 600 }}>{party?.name || ''}</p>
                  <p style={{ marginBottom: '2px', fontSize: '0.82rem', color: '#475569' }}>{party?.address || ''}</p>
                  <p style={{ marginBottom: '2px', fontSize: '0.82rem', color: '#475569' }}>{party?.city}{party?.city && party?.state ? ', ' : ''}{party?.state || ''} - {party?.pincode || ''}</p>
                  <p style={{ marginBottom: 0, fontSize: '0.82rem', color: '#475569' }}>GSTIN: {party?.gstin || 'N/A'}</p>
                </div>
              </div>
              <div className="col-6">
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ padding: '5px 4px', fontWeight: 500, color: '#64748b', borderBottom: `1px solid ${s.borderColor}` }}>Invoice No</td><td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 600, borderBottom: `1px solid ${s.borderColor}` }}>{invoice.invoiceNo}</td></tr>
                    <tr><td style={{ padding: '5px 4px', fontWeight: 500, color: '#64748b', borderBottom: `1px solid ${s.borderColor}` }}>Date</td><td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 600, borderBottom: `1px solid ${s.borderColor}` }}>{formatDate(invoice.invoiceDate)}</td></tr>
                    <tr><td style={{ padding: '5px 4px', fontWeight: 500, color: '#64748b', borderBottom: `1px solid ${s.borderColor}` }}>Due Date</td><td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 600, borderBottom: `1px solid ${s.borderColor}` }}>{formatDate(invoice.dueDate)}</td></tr>
                    <tr><td style={{ padding: '5px 4px', fontWeight: 500, color: '#64748b' }}>Place of Supply</td><td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 600 }}>{invoice.placeOfSupply || party?.state || ''}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: s.tableHeaderBg, color: s.tableHeaderText }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '30px' }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>HSN/SAC</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Taxable</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>CGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>SGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>IGST</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${s.borderColor}` }}>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px' }}>{item.description || item.product?.name || ''}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.product?.hsnCode || item.hsnCode || ''}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity} {item.unit || ''}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.taxableValue)}</td>
                    {item.igst > 0 ? (
                      <>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.igst)}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.cgst)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.sgst)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>-</td>
                      </>
                    )}
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: `2px solid ${s.accentColor}`, background: '#f0f4f8' }}>
                  <td colSpan="5" style={{ padding: '10px 12px', textAlign: 'right' }}>Total</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.cgstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.sgstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.igstTotal || 0)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatCurrency(invoice.grandTotal || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="row mt-3" style={{ padding: '0 24px' }}>
            <div className="col-7">
              <div style={{ background: '#f0f4f8', padding: '12px', borderRadius: '4px' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Amount in Words:</p>
                <p style={{ marginBottom: 0 }}>{invoice.amountInWords || amountInWords(invoice.grandTotal || 0)}</p>
              </div>
              {invoice.notes && (
                <div style={{ padding: '10px 0', fontSize: '0.82rem', color: '#475569' }}>
                  <p style={{ marginBottom: '2px', fontWeight: 600 }}>Notes:</p>
                  <p style={{ marginBottom: 0 }}>{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="col-5">
              {renderTaxSummary()}
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: `2px solid ${s.accentColor}`, padding: '14px 24px 0' }}>
            <div className="row">
              <div className="col-6">
                {showSection('bank') && company?.bankName && (
                  <div style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
                    <p style={{ marginBottom: '2px', fontWeight: 600 }}>Bank Details:</p>
                    <p style={{ marginBottom: '1px' }}>{company.bankName} | A/c: {company.accountNo}</p>
                    <p style={{ marginBottom: 0 }}>IFSC: {company.ifscCode}</p>
                  </div>
                )}
                {company?.upiId && company?.upiQrEnabled && (
                  <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '8px' }}>
                    <p style={{ marginBottom: '2px', fontWeight: 600, color: '#16a34a', fontSize: '0.82rem' }}>Pay via UPI</p>
                    <p style={{ marginBottom: 0, fontSize: '0.82rem' }}>UPI ID: <strong>{company.upiId}</strong></p>
                    <div style={{ marginTop: 6 }}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.businessName || '')}`} 
                           alt="UPI QR" style={{ width: 80, height: 80 }} />
                    </div>
                  </div>
                )}
                {showSection('transport') && invoice.transportMode && (
                  <div style={{ fontSize: '0.8rem' }}>
                    <p style={{ marginBottom: '2px' }}>Transport: {invoice.transportMode} | Vehicle: {invoice.vehicleNo || ''}</p>
                    {invoice.eWayBillNo && <p style={{ marginBottom: 0 }}>E-Way Bill: {invoice.eWayBillNo}</p>}
                  </div>
                )}
                {showSection('terms') && invoice.termsAndConditions && (
                  <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '8px' }}>{invoice.termsAndConditions}</p>
                )}
              </div>
              <div className="col-6 text-end">
                {showSection('signature') && <div>
                  {company?.signature && <img src={company.signature} alt="Signature" style={{ maxHeight: '45px', marginBottom: '2px' }} />}
                  <p style={{ fontWeight: 600, marginBottom: 0 }}>Authorised Signatory</p>
                  <p style={{ fontSize: '0.8rem', marginBottom: 0, color: '#475569' }}>For {company?.businessName || ''}</p>
                </div>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Template: Retail */}
      {template === 'retail' && (
        <div style={{ padding: '16px', maxWidth: '580px', margin: '0 auto', fontSize: '0.78rem', lineHeight: '1.5' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: `2px solid ${s.accentColor}`, paddingBottom: '10px' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '2px', fontSize: '1.2rem' }}>{company?.businessName || 'Business Name'}</h2>
            <p style={{ margin: '0 0 2px', fontSize: '0.72rem' }}>{company?.address}{company?.address ? ', ' : ''}{company?.city || ''}</p>
            <p style={{ margin: '0 0 2px', fontSize: '0.72rem' }}>{company?.state}{company?.state ? ' - ' : ''}{company?.pincode || ''}</p>
            <p style={{ margin: 0, fontSize: '0.72rem' }}>GSTIN: {company?.gstin || 'N/A'}</p>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '6px', color: s.accentColor }}>{getDocumentTitle(invoice.invoiceType)}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem' }}>
            <span><strong>Invoice:</strong> {invoice.invoiceNo}</span>
            <span><strong>Date:</strong> {formatDate(invoice.invoiceDate)}</span>
          </div>

          <div style={{ marginBottom: '10px', padding: '6px 8px', background: '#f8f9fc', borderRadius: '4px', fontSize: '0.75rem' }}>
            <strong>{party?.name || ''}</strong> | {party?.gstin || 'N/A'}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: s.tableHeaderBg, color: s.tableHeaderText, borderBottom: `2px solid ${s.accentColor}` }}>
                <th style={{ padding: '4px 6px', textAlign: 'center', width: '24px' }}>#</th>
                <th style={{ padding: '4px 6px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', width: '40px' }}>Qty</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', width: '55px' }}>Rate</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', width: '65px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${s.borderColor}` }}>
                  <td style={{ padding: '3px 6px', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '3px 6px' }}>{item.description || item.product?.name || ''}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.taxableValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '8px', borderTop: `1px solid ${s.accentColor}`, paddingTop: '6px' }}>
            <table style={{ width: '100%', fontSize: '0.75rem' }}>
              <tbody>
                <tr><td>Subtotal</td><td style={{ textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td></tr>
                {invoice.cgstTotal > 0 && <tr><td>+ CGST</td><td style={{ textAlign: 'right' }}>{formatCurrency(invoice.cgstTotal)}</td></tr>}
                {invoice.sgstTotal > 0 && <tr><td>+ SGST</td><td style={{ textAlign: 'right' }}>{formatCurrency(invoice.sgstTotal)}</td></tr>}
                {invoice.igstTotal > 0 && <tr><td>+ IGST</td><td style={{ textAlign: 'right' }}>{formatCurrency(invoice.igstTotal)}</td></tr>}
                {invoice.roundOff !== 0 && <tr><td>Round Off</td><td style={{ textAlign: 'right' }}>{formatCurrency(invoice.roundOff)}</td></tr>}
                <tr style={{ fontWeight: 700, fontSize: '0.85rem', borderTop: `1px solid ${s.accentColor}` }}>
                  <td style={{ paddingTop: '4px' }}>Total</td>
                  <td style={{ textAlign: 'right', paddingTop: '4px' }}>{formatCurrency(invoice.grandTotal || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {invoice.amountInWords && (
            <p style={{ marginTop: '6px', fontSize: '0.72rem', fontStyle: 'italic', textAlign: 'center' }}>{invoice.amountInWords}</p>
          )}

          <div style={{ marginTop: '10px', borderTop: `1px solid ${s.borderColor}`, paddingTop: '6px', fontSize: '0.72rem', textAlign: 'center', color: '#64748b' }}>
            {showSection('terms') && invoice.termsAndConditions && <p style={{ margin: '0 0 4px' }}>{invoice.termsAndConditions}</p>}
            {showSection('signature') && <p style={{ margin: 0, fontWeight: 600 }}>For {company?.businessName || ''}</p>}
            <p style={{ margin: 0, fontSize: '0.65rem' }}>This is a Computer Generated Invoice</p>
          </div>
        </div>
      )}

      {/* Template: Tally */}
      {template === 'tally' && (
        <div style={{ padding: '0px', color: '#000', fontSize: '12px', lineHeight: '1.4' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
            {getDocumentTitle(invoice.invoiceType)}
          </div>
          <div style={{ border: `1px solid ${s.borderColor}`, display: 'flex', flexDirection: 'column' }}>
            
            {/* Top Section */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${s.borderColor}` }}>
              {/* Left Column (Company & Buyer) */}
              <div style={{ width: '50%', borderRight: `1px solid ${s.borderColor}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px', borderBottom: `1px solid ${s.borderColor}`, flexGrow: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{company?.businessName || ''}</p>
                  <p style={{ margin: 0 }}>{company?.address || ''}</p>
                  <p style={{ margin: 0 }}>{company?.city ? `${company.city}, ` : ''}{company?.state || ''} {company?.pincode || ''}</p>
                  <p style={{ margin: 0 }}>GSTIN/UIN: <strong>{company?.gstin || ''}</strong></p>
                  <p style={{ margin: 0 }}>State Name: {company?.state || ''}</p>
                  <p style={{ margin: 0 }}>E-Mail: {company?.email || ''}</p>
                </div>
                <div style={{ padding: '8px', flexGrow: 1 }}>
                  <p style={{ margin: 0 }}>Buyer (Bill to)</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>{party?.name || ''}</p>
                  <p style={{ margin: 0 }}>{party?.address || ''}</p>
                  <p style={{ margin: 0 }}>{party?.city ? `${party.city}, ` : ''}{party?.state || ''} {party?.pincode || ''}</p>
                  <p style={{ margin: 0 }}>GSTIN/UIN: <strong>{party?.gstin || ''}</strong></p>
                  <p style={{ margin: 0 }}>State Name: {party?.state || ''}</p>
                </div>
              </div>
              
              {/* Right Column (Invoice details) */}
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', borderBottom: `1px solid ${s.borderColor}` }}>
                  <div style={{ width: '50%', padding: '8px', borderRight: `1px solid ${s.borderColor}` }}>
                    <p style={{ margin: 0 }}>Invoice No.</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.invoiceNo}</p>
                  </div>
                  <div style={{ width: '50%', padding: '8px' }}>
                    <p style={{ margin: 0 }}>Dated</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{formatDate(invoice.invoiceDate)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${s.borderColor}` }}>
                  <div style={{ width: '50%', padding: '8px', borderRight: `1px solid ${s.borderColor}` }}>
                    <p style={{ margin: 0 }}>Delivery Note</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.deliveryNote || ''}</p>
                  </div>
                  <div style={{ width: '50%', padding: '8px' }}>
                    <p style={{ margin: 0 }}>Mode/Terms of Payment</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.termsOfPayment || ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${s.borderColor}` }}>
                  <div style={{ width: '50%', padding: '8px', borderRight: `1px solid ${s.borderColor}` }}>
                    <p style={{ margin: 0 }}>Supplier's Ref.</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.supplierRef || ''}</p>
                  </div>
                  <div style={{ width: '50%', padding: '8px' }}>
                    <p style={{ margin: 0 }}>Other Reference(s)</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.otherRef || ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${s.borderColor}` }}>
                  <div style={{ width: '50%', padding: '8px', borderRight: `1px solid ${s.borderColor}` }}>
                    <p style={{ margin: 0 }}>Buyer's Order No.</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.buyersOrderNo || ''}</p>
                  </div>
                  <div style={{ width: '50%', padding: '8px' }}>
                    <p style={{ margin: 0 }}>Dated</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.orderDate ? formatDate(invoice.orderDate) : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${s.borderColor}` }}>
                  <div style={{ width: '50%', padding: '8px', borderRight: `1px solid ${s.borderColor}` }}>
                    <p style={{ margin: 0 }}>Dispatch Document No.</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.dispatchDocNo || ''}</p>
                  </div>
                  <div style={{ width: '50%', padding: '8px' }}>
                    <p style={{ margin: 0 }}>Delivery Note Date</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.deliveryNoteDate ? formatDate(invoice.deliveryNoteDate) : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${s.borderColor}` }}>
                  <div style={{ width: '50%', padding: '8px', borderRight: `1px solid ${s.borderColor}` }}>
                    <p style={{ margin: 0 }}>Dispatched through</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.transportMode || ''}</p>
                  </div>
                  <div style={{ width: '50%', padding: '8px' }}>
                    <p style={{ margin: 0 }}>Destination</p>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.destination || ''}</p>
                  </div>
                </div>
                <div style={{ padding: '8px', flexGrow: 1 }}>
                  <p style={{ margin: 0 }}>Terms of Delivery</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{invoice.termsOfDelivery || ''}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: `1px solid ${s.borderColor}` }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.borderColor}` }}>
                  <th style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', width: '4%' }}>Sl<br/>No.</th>
                  <th style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', width: '40%' }}>Description of Goods</th>
                  <th style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', width: '10%' }}>HSN/SAC</th>
                  <th style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', width: '12%' }}>Quantity</th>
                  <th style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', width: '10%' }}>Rate</th>
                  <th style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', width: '8%' }}>per</th>
                  <th style={{ padding: '4px', textAlign: 'center', width: '16%' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i}>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'center', verticalAlign: 'top' }}>{i + 1}</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', verticalAlign: 'top' }}>
                      <strong>{item.description || item.product?.name || ''}</strong>
                    </td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'center', verticalAlign: 'top' }}>{item.product?.hsnCode || item.hsnCode || ''}</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right', verticalAlign: 'top' }}>
                      <strong>{item.quantity}</strong> {item.unit || ''}
                    </td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right', verticalAlign: 'top' }}>{Number(item.rate).toFixed(2)}</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'center', verticalAlign: 'top' }}>{item.unit || ''}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', verticalAlign: 'top' }}>
                      <strong>{Number(item.taxableValue).toFixed(2)}</strong>
                    </td>
                  </tr>
                ))}
                
                {/* Empty filler rows to stretch if items are few - simulated */}
                <tr>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '60px 4px' }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                  <td></td>
                </tr>

                {/* CGST / SGST rows */}
                {invoice.cgstTotal > 0 && (
                  <tr>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '2px 6px', textAlign: 'right' }}>Output CGST</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{Number(invoice.cgstTotal).toFixed(2)}</td>
                  </tr>
                )}
                {invoice.sgstTotal > 0 && (
                  <tr>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '2px 6px', textAlign: 'right' }}>Output SGST</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{Number(invoice.sgstTotal).toFixed(2)}</td>
                  </tr>
                )}
                {invoice.igstTotal > 0 && (
                  <tr>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '2px 6px', textAlign: 'right' }}>Output IGST</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{Number(invoice.igstTotal).toFixed(2)}</td>
                  </tr>
                )}
                {invoice.roundOff !== 0 && (
                  <tr>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '2px 6px', textAlign: 'right' }}>Round Off</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}` }}></td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{Number(invoice.roundOff).toFixed(2)}</td>
                  </tr>
                )}

                <tr style={{ borderTop: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}` }}>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '6px' }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '6px' }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '6px' }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '6px' }}></td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '6px' }}></td>
                  <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>₹ {Number(invoice.grandTotal).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Amount in words */}
            <div style={{ padding: '8px', borderBottom: `1px solid ${s.borderColor}` }}>
              <p style={{ margin: 0 }}>Amount Chargeable (in words)</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>INR {invoice.amountInWords || amountInWords(invoice.grandTotal || 0)}</p>
            </div>

            {/* Tax details table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: `1px solid ${s.borderColor}` }}>
              <thead>
                <tr>
                  <th rowSpan="2" style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>HSN/SAC</th>
                  <th rowSpan="2" style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>Taxable<br/>Value</th>
                  {invoice.igstTotal > 0 ? (
                    <th colSpan="2" style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Integrated Tax</th>
                  ) : (
                    <>
                      <th colSpan="2" style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Central Tax</th>
                      <th colSpan="2" style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>State Tax</th>
                    </>
                  )}
                  <th rowSpan="2" style={{ borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>Total<br/>Tax Amount</th>
                </tr>
                <tr>
                  {invoice.igstTotal > 0 ? (
                    <>
                      <th style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Rate</th>
                      <th style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Amount</th>
                    </>
                  ) : (
                    <>
                      <th style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Rate</th>
                      <th style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Amount</th>
                      <th style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Rate</th>
                      <th style={{ borderRight: `1px solid ${s.borderColor}`, borderBottom: `1px solid ${s.borderColor}`, padding: '4px', textAlign: 'center' }}>Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i}>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'center' }}>{item.product?.hsnCode || item.hsnCode || ''}</td>
                    <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(item.taxableValue).toFixed(2)}</td>
                    {invoice.igstTotal > 0 ? (
                      <>
                        <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{item.igstRate || (item.taxRate || 18)}%</td>
                        <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(item.igst || 0).toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{(item.cgstRate || (item.taxRate ? item.taxRate/2 : 9))}%</td>
                        <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(item.cgst || 0).toFixed(2)}</td>
                        <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{(item.sgstRate || (item.taxRate ? item.taxRate/2 : 9))}%</td>
                        <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(item.sgst || 0).toFixed(2)}</td>
                      </>
                    )}
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{Number((item.igst || 0) + (item.cgst || 0) + (item.sgst || 0)).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `1px solid ${s.borderColor}`, fontWeight: 'bold' }}>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>Total</td>
                  <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(invoice.subtotal).toFixed(2)}</td>
                  {invoice.igstTotal > 0 ? (
                    <>
                      <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px' }}></td>
                      <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(invoice.igstTotal).toFixed(2)}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px' }}></td>
                      <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(invoice.cgstTotal).toFixed(2)}</td>
                      <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px' }}></td>
                      <td style={{ borderRight: `1px solid ${s.borderColor}`, padding: '4px 6px', textAlign: 'right' }}>{Number(invoice.sgstTotal).toFixed(2)}</td>
                    </>
                  )}
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{Number((invoice.igstTotal || 0) + (invoice.cgstTotal || 0) + (invoice.sgstTotal || 0)).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Bottom section: Company PAN, Declaration, Signature */}
            <div style={{ display: 'flex' }}>
              <div style={{ width: '50%', borderRight: `1px solid ${s.borderColor}`, padding: '8px' }}>
                {company?.pan && (
                  <p style={{ margin: '0 0 10px 0' }}>Company's PAN : <strong>{company.pan}</strong></p>
                )}
                {showSection('bank') && company?.bankName && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: 0, textDecoration: 'underline' }}>Company's Bank Details</p>
                    <p style={{ margin: 0 }}>Bank Name : <strong>{company.bankName}</strong></p>
                    <p style={{ margin: 0 }}>A/c No. : <strong>{company.accountNo}</strong></p>
                    <p style={{ margin: 0 }}>Branch & IFS Code : <strong>{company.ifscCode}</strong></p>
                  </div>
                )}
                {company?.upiId && company?.upiQrEnabled && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: 0, textDecoration: 'underline' }}>Pay via UPI</p>
                    <p style={{ margin: 0 }}>UPI ID : <strong>{company.upiId}</strong></p>
                    <div style={{ marginTop: 4 }}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.businessName || '')}`} 
                           alt="UPI QR" style={{ width: 80, height: 80 }} />
                    </div>
                  </div>
                )}
                {showSection('terms') && <><p style={{ margin: 0, textDecoration: 'underline' }}>Declaration</p>
                <p style={{ margin: 0, fontSize: '11px' }}>
                  {invoice.termsAndConditions || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                </p></>}
              </div>
              <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px', textAlign: 'right', flexGrow: 1 }}>
                  {showSection('signature') && <><p style={{ margin: 0, fontWeight: 'bold' }}>for {company?.businessName || ''}</p>
                  <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {company?.signature && <img src={company.signature} alt="Signature" style={{ maxHeight: '50px' }} />}
                  </div>
                  <p style={{ margin: 0 }}>Authorised Signatory</p></>}
                </div>
              </div>
            </div>

          </div>
          <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px' }}>This is a Computer Generated Invoice</p>
        </div>
      )}
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;

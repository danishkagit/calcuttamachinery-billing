import React, { forwardRef } from 'react';
import { formatCurrency, formatDate, amountInWords } from '../utils/helpers';

const styles = {
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
  }
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

const InvoiceTemplate = forwardRef(({ invoice, company, party, template = 'classic' }, ref) => {
  if (!invoice) return null;
  const s = styles[template] || styles.classic;

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
            </div>
          </div>

          <div className="row mt-3 px-3">
            <div className="col-6">
              {company?.bankName && (
                <div style={{ background: '#f8f9fc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                  <h6 style={{ fontWeight: 700, marginBottom: '6px', color: s.accentColor }}>Bank Details:</h6>
                  <p style={{ marginBottom: '2px', fontSize: '0.85rem' }}>Bank: {company.bankName}</p>
                  <p style={{ marginBottom: '2px', fontSize: '0.85rem' }}>Account: {company.accountNo}</p>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>IFSC: {company.ifscCode}</p>
                </div>
              )}
            </div>
            <div className="col-6">
              {invoice.termsAndConditions && (
                <div style={{ background: '#f8f9fc', padding: '14px', borderRadius: '8px', border: `1px solid ${s.borderColor}` }}>
                  <h6 style={{ fontWeight: 700, marginBottom: '6px', color: s.accentColor }}>Terms & Conditions:</h6>
                  <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="row mt-4 px-3">
            <div className="col-6">
              {invoice.transportMode && (
                <div style={{ fontSize: '0.8rem' }}>
                  <p style={{ marginBottom: '2px' }}>Transport: {invoice.transportMode} | Vehicle: {invoice.vehicleNo || ''}</p>
                  {invoice.eWayBillNo && <p style={{ marginBottom: 0 }}>E-Way Bill: {invoice.eWayBillNo} | {invoice.transportName || ''}</p>}
                </div>
              )}
            </div>
            <div className="col-6 text-end">
              {company?.signature && <img src={company.signature} alt="Signature" style={{ maxHeight: '50px', marginBottom: '4px' }} />}
              <p style={{ fontWeight: 600, marginBottom: 0 }}>Authorised Signatory</p>
              <p style={{ fontSize: '0.8rem', marginBottom: 0 }}>For {company?.businessName || ''}</p>
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

          <div style={{ padding: '0 24px', marginTop: '20px', borderTop: `1px solid ${s.borderColor}`, paddingTop: '16px' }}>
            <div className="row">
              <div className="col-6">
                {company?.bankName && (
                  <div style={{ fontSize: '0.82rem' }}>
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>Bank Details:</p>
                    <p style={{ marginBottom: '2px', color: '#64748b' }}>{company.bankName} | A/C: {company.accountNo}</p>
                    <p style={{ marginBottom: 0, color: '#64748b' }}>IFSC: {company.ifscCode}</p>
                  </div>
                )}
              </div>
              <div className="col-6 text-end">
                {company?.signature && <img src={company.signature} alt="Signature" style={{ maxHeight: '40px', marginBottom: '2px' }} />}
                <p style={{ fontWeight: 600, marginBottom: 0 }}>Authorised Signatory</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Template: Minimal */}
      {template === 'minimal' && (
        <>
          <div style={{ padding: '20px', borderBottom: `2px solid ${s.accentColor}`, marginBottom: '20px' }}>
            <div className="row">
              <div className="col-8">
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: s.headerText, marginBottom: '4px' }}>{company?.businessName || 'Business'}</h2>
                <p style={{ color: '#64748b', marginBottom: '2px', fontSize: '0.85rem' }}>{company?.address || ''}{company?.city ? `, ${company.city}` : ''}</p>
                <p style={{ color: '#64748b', marginBottom: 0, fontSize: '0.82rem' }}>GSTIN: {company?.gstin || 'N/A'}</p>
              </div>
              <div className="col-4 text-end">
                <div style={{ fontWeight: 700, fontSize: '1.3rem', color: s.accentColor }}>{getDocumentTitle(invoice.invoiceType)}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>#{invoice.invoiceNo}</div>
              </div>
            </div>
          </div>

          <div className="row mb-4" style={{ padding: '0 20px' }}>
            <div className="col-6">
              <p style={{ marginBottom: '2px', fontSize: '0.85rem' }}><span style={{ color: '#64748b' }}>Date:</span> {formatDate(invoice.invoiceDate)}</p>
              <p style={{ marginBottom: 0, fontSize: '0.85rem' }}><span style={{ color: '#64748b' }}>Due:</span> {formatDate(invoice.dueDate)}</p>
            </div>
            <div className="col-6 text-end">
              <p style={{ marginBottom: '2px', fontWeight: 600 }}>{party?.name || ''}</p>
              <p style={{ marginBottom: 0, fontSize: '0.85rem', color: '#64748b' }}>{party?.gstin || 'No GSTIN'}</p>
            </div>
          </div>

          <div style={{ padding: '0 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${s.accentColor}` }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: s.accentColor, fontWeight: 600 }}>Item</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: s.accentColor, fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: s.accentColor, fontWeight: 600 }}>Rate</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: s.accentColor, fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${s.borderColor}` }}>
                    <td style={{ padding: '8px 10px' }}>
                      {item.description || item.product?.name || ''}
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>HSN: {item.product?.hsnCode || item.hsnCode || ''}</div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity} {item.unit || ''}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row mt-3" style={{ padding: '0 20px' }}>
            <div className="col-6">
              <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{invoice.amountInWords || amountInWords(invoice.grandTotal || 0)}</p>
            </div>
            <div className="col-6 text-end">
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <tr><td style={{ padding: '3px 0', color: '#64748b' }}>Subtotal</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency(invoice.subtotal || 0)}</td></tr>
                <tr><td style={{ padding: '3px 0', color: '#64748b' }}>Tax</td><td style={{ padding: '3px 0', textAlign: 'right' }}>{formatCurrency((invoice.cgstTotal || 0) + (invoice.sgstTotal || 0) + (invoice.igstTotal || 0))}</td></tr>
                <tr style={{ borderTop: `2px solid ${s.accentColor}` }}>
                  <td style={{ padding: '6px 0', fontWeight: 700, fontSize: '1rem' }}>Total</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: s.accentColor }}>{formatCurrency(invoice.grandTotal || 0)}</td>
                </tr>
              </table>
            </div>
          </div>

          <div style={{ padding: '0 20px', marginTop: '24px', borderTop: `1px solid ${s.borderColor}`, paddingTop: '12px' }}>
            <div className="row">
              <div className="col-6">
                {invoice.termsAndConditions && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{invoice.termsAndConditions}</p>}
              </div>
              <div className="col-6 text-end">
                <p style={{ fontWeight: 600, marginBottom: 0 }}>For {company?.businessName || ''}</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Authorised Signatory</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../utils/helpers';
import Loading from '../components/Loading';
const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [party, setParty] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState('classic');
  const [printFormat, setPrintFormat] = useState('a4');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', reference: '', notes: '' });
  const [recording, setRecording] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [invRes, compRes] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get('/company')
      ]);
      const inv = invRes.data.data;
      const comp = compRes.data.data;
      setInvoice(inv);
      setCompany(comp);
      if (inv.party) setParty(typeof inv.party === 'object' ? inv.party : null);
      
      if (comp && comp.defaultTemplate) {
        setTemplate(comp.defaultTemplate);
      }
    } catch (err) {
      window.alert('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const payload = {
        invoiceType: invoice.invoiceType,
        party: invoice.party?._id,
        company: invoice.company?._id,
        items: (invoice.items || []).map(item => ({
          product: item.product?._id || item.product,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          taxRate: item.taxRate,
          cess: item.cess || 0
        })),
        notes: `Duplicate of ${invoice.invoiceNo}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        termsAndConditions: invoice.termsAndConditions,
        placeOfSupply: invoice.placeOfSupply
      };
      const res = await api.post('/invoices', payload);
      navigate(`/invoices/${res.data.data._id}`);
    } catch (err) {
      window.alert('Failed to duplicate: ' + (err.response?.data?.error || err.message));
    } finally {
      setDuplicating(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.remove('a5-print', 'thermal-print');
    if (printFormat !== 'a4') {
      document.body.classList.add(`${printFormat}-print`);
    }
    setTimeout(() => {
      window.print();
      document.body.classList.remove('a5-print', 'thermal-print');
    }, 100);
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      window.alert('Enter a valid amount');
      return;
    }
    setRecording(true);
    try {
      await api.post(`/invoices/${invoice._id}/payment`, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference,
        notes: paymentForm.notes
      });
      window.alert('Payment recorded');
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', reference: '', notes: '' });
      fetchData();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setRecording(false);
    }
  };

  if (loading) return <Loading />;
  if (!invoice) return <Loading />;

  const dueAmount = (invoice.grandTotal || 0) - (invoice.paidAmount || 0);

  return (
    <div className="invoice-view-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <h4 className="fw-bold mb-0">{invoice.invoiceType}: {invoice.invoiceNo}</h4>
        <div className="d-flex gap-2 flex-wrap">
          <div className="btn-group me-2">
            <button className={`btn btn-sm ${template === 'classic' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('classic')}>Classic</button>
            <button className={`btn btn-sm ${template === 'modern' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('modern')}>Modern</button>
            <button className={`btn btn-sm ${template === 'minimal' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('minimal')}>Minimal</button>
            <button className={`btn btn-sm ${template === 'professional' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('professional')}>Pro</button>
            <button className={`btn btn-sm ${template === 'elegant' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('elegant')}>Elegant</button>
            <button className={`btn btn-sm ${template === 'corporate' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('corporate')}>Corporate</button>
            <button className={`btn btn-sm ${template === 'retail' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('retail')}>Retail</button>
            <button className={`btn btn-sm ${template === 'tally' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTemplate('tally')}>Tally ERP</button>
          </div>
          <div className="btn-group me-2">
            <button className={`btn btn-sm ${printFormat === 'a4' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setPrintFormat('a4')}>A4</button>
            <button className={`btn btn-sm ${printFormat === 'a5' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setPrintFormat('a5')}>A5</button>
            <button className={`btn btn-sm ${printFormat === 'thermal' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setPrintFormat('thermal')}>80mm</button>
          </div>
          <button className="btn btn-primary" onClick={handlePrint}><i className="fas fa-print me-1"></i>Print</button>
          <button className="btn btn-success" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Invoice ' + invoice.invoiceNo + ' from ' + (company?.businessName || ''))}`, '_blank')}><i className="fab fa-whatsapp me-1"></i>WhatsApp</button>
          <button className="btn btn-info text-white" onClick={() => window.open(`mailto:?subject=Invoice ${invoice.invoiceNo}&body=${encodeURIComponent('Please find attached invoice ' + invoice.invoiceNo + ' from ' + (company?.businessName || ''))}`)}><i className="fas fa-envelope me-1"></i>Email</button>
          <Link to={`/invoices/edit/${invoice._id}`} className="btn btn-outline-primary"><i className="fas fa-edit me-1"></i>Edit</Link>
          <button className="btn btn-outline-info" onClick={handleDuplicate} disabled={duplicating}>
            <i className="fas fa-copy me-1"></i>{duplicating ? 'Duplicating...' : 'Duplicate'}
          </button>
          {invoice.paymentStatus !== 'Paid' && (
            <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#paymentModal"><i className="fas fa-money-bill me-1"></i>Pay</button>
          )}
          <Link to="/invoices" className="btn btn-outline-secondary"><i className="fas fa-arrow-left me-1"></i>Back</Link>
        </div>
      </div>

      <div className="row g-4 no-print mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <p className="mb-1 small text-muted">Invoice #</p>
                  <p className="fw-semibold">{invoice.invoiceNo}</p>
                  <p className="mb-1 small text-muted">Invoice Date</p>
                  <p className="fw-semibold">{formatDate(invoice.invoiceDate)}</p>
                  <p className="mb-1 small text-muted">Due Date</p>
                  <p className="fw-semibold">{formatDate(invoice.dueDate)}</p>
                </div>
                <div className="col-6">
                  <p className="mb-1 small text-muted">Party</p>
                  <p className="fw-semibold">{party?.name || ''}</p>
                  <p className="small">{party?.address}, {party?.city}, {party?.state}</p>
                  <p className="small mb-1">GSTIN: {party?.gstin || 'N/A'}</p>
                  <p className="small mb-0">Mobile: {party?.mobile}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Status</span>
                <span className={`badge ${invoice.paymentStatus === 'Paid' ? 'bg-success' : invoice.paymentStatus === 'Partial' ? 'bg-warning text-dark' : 'bg-danger'} fs-6`}>
                  {invoice.paymentStatus}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Grand Total</span>
                <span className="fw-bold fs-5 text-primary">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Paid</span>
                <span className="fw-semibold text-success">{formatCurrency(invoice.paidAmount || 0)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Due</span>
                <span className="fw-semibold text-danger">{formatCurrency(dueAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {invoice.transportMode && (
        <div className="card border-0 shadow-sm mb-4 no-print">
          <div className="card-body">
            <div className="row">
              <div className="col-3">
                <p className="mb-1 small text-muted">E-Way Bill / Transport</p>
                <p className="fw-semibold mb-0">{invoice.transportMode}</p>
              </div>
              <div className="col-3">
                <p className="mb-1 small text-muted">Vehicle No</p>
                <p className="fw-semibold mb-0">{invoice.vehicleNo || 'N/A'}</p>
              </div>
              <div className="col-3">
                <p className="mb-1 small text-muted">Transport Name</p>
                <p className="fw-semibold mb-0">{invoice.transportName || 'N/A'}</p>
              </div>
              <div className="col-3">
                <p className="mb-1 small text-muted">E-Way Bill No</p>
                <p className="fw-semibold mb-0">{invoice.eWayBillNo || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="invoice-print-area" ref={printRef}>
        <InvoiceTemplate invoice={invoice} company={company} party={party} template={template} templateSettings={company?.templateSettings || {}} />
      </div>

      {payments.length > 0 && (
        <div className="card border-0 shadow-sm mt-4 no-print">
          <div className="card-header bg-white py-3">
            <h6 className="fw-bold mb-0"><i className="fas fa-history me-2"></i>Payment History</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td className="fw-semibold">{formatCurrency(p.amount)}</td>
                      <td>{p.paymentMethod}</td>
                      <td>{p.reference || '-'}</td>
                      <td className="small">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="modal fade" id="paymentModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title fw-bold">Record Payment</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => setShowPaymentModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold small">Invoice Amount</label>
                <p className="fw-bold">{formatCurrency(invoice.grandTotal)}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Due Amount</label>
                <p className="fw-bold text-danger">{formatCurrency(dueAmount)}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Payment Amount *</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input type="number" className="form-control" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} min={0} max={dueAmount} step={0.01} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Payment Date *</label>
                <input type="date" className="form-control" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Payment Method *</label>
                <select className="form-select" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Reference (Cheque/Transaction ID)</label>
                <input type="text" className="form-control" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Notes</label>
                <textarea className="form-control" rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-success" disabled={recording} onClick={handleRecordPayment}>
                {recording ? <><span className="spinner-border spinner-border-sm me-2"></span>Recording...</> : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;

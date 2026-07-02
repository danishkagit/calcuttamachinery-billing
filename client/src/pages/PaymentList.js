import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ invoice: '', party: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', reference: '', notes: '' });
  const limit = 15;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search };
      const res = await api.get('/payments', { params });
      setPayments(res.data.data || []);
      setTotalPages(Math.ceil((res.data.count || 0) / limit) || 1);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    api.get('/parties', { params: { limit: 500 } }).then(res => setParties(res.data.data || [])).catch(() => {});
    api.get('/invoices', { params: { limit: 500 } }).then(res => setInvoices(res.data.data || [])).catch(() => {});
  }, []);

  const openModal = () => {
    setForm({ invoice: '', party: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', reference: '', notes: '' });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { ...form, [name]: value };
    if (name === 'invoice') {
      const inv = invoices.find(i => i._id === value);
      if (inv) {
        updates.party = typeof inv.party === 'object' ? inv.party?._id : inv.party;
        updates.amount = (inv.grandTotal || 0) - (inv.paidAmount || 0);
      }
    }
    setForm(updates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.invoice || !form.amount || form.amount <= 0) {
      toast.error('Select invoice and enter valid amount');
      return;
    }
    setSaving(true);
    try {
      await api.post('/payments', form);
      toast.success('Payment recorded');
      setShowModal(false);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await api.delete(`/payments/${id}`);
      toast.success('Payment deleted');
      fetchPayments();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getPartyName = (party) => {
    if (!party) return '';
    if (typeof party === 'object') return party.name;
    const found = parties.find(p => p._id === party);
    return found ? found.name : '';
  };

  const getInvoiceNo = (inv) => {
    if (!inv) return '';
    if (typeof inv === 'object') return inv.invoiceNo;
    const found = invoices.find(i => i._id === inv);
    return found ? found.invoiceNo : '';
  };

  if (loading && page === 1) return <Loading />;

  return (
    <div className="payment-list-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Payments</h4>
        <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#paymentModal" onClick={openModal}><i className="fas fa-plus me-1"></i>Record Payment</button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text"><i className="fas fa-search"></i></span>
                <input type="text" className="form-control" placeholder="Search by reference or notes..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Party</th>
                <th className="text-end">Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">No payments recorded yet</td></tr>
              ) : payments.map(p => (
                <tr key={p._id}>
                  <td className="small">{formatDate(p.paymentDate)}</td>
                  <td className="fw-semibold">{getInvoiceNo(p.invoice)}</td>
                  <td>{getPartyName(p.party)}</td>
                  <td className="text-end fw-semibold text-success">{formatCurrency(p.amount)}</td>
                  <td><span className="badge bg-info">{p.paymentMethod}</span></td>
                  <td className="small">{p.reference || '-'}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p._id)}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}><i className="fas fa-chevron-left"></i></button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}><i className="fas fa-chevron-right"></i></button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <div className="modal fade" id="paymentModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title fw-bold">Record Payment</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Invoice *</label>
                  <select className="form-select" name="invoice" value={form.invoice} onChange={handleChange}>
                    <option value="">Select Invoice</option>
                    {invoices.map(inv => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNo} - {typeof inv.party === 'object' ? inv.party?.name : ''} - {formatCurrency(inv.grandTotal)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Amount *</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input type="number" className="form-control" name="amount" value={form.amount} onChange={handleChange} min={0} step={0.01} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Payment Date *</label>
                  <input type="date" className="form-control" name="paymentDate" value={form.paymentDate} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Payment Method *</label>
                  <select className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Reference</label>
                  <input type="text" className="form-control" name="reference" value={form.reference} onChange={handleChange} placeholder="Cheque/Transaction ID" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Notes</label>
                  <textarea className="form-control" name="notes" rows={2} value={form.notes} onChange={handleChange}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentList;

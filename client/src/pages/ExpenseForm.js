import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useCompany } from '../context/CompanyContext';
import Loading from '../components/Loading';

const CATEGORIES = ['Office Rent', 'Electricity', 'Salary', 'Transport', 'Raw Material', 'Packaging', 'Maintenance', 'Marketing', 'Insurance', 'Legal', 'Travel', 'Stationery', 'Telephone', 'Other'];
const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card', 'Others'];

const ExpenseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { company } = useCompany();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: 'Other',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      api.get(`/expenses/${id}`).then(res => {
        const d = res.data.data;
        setForm({
          category: d.category || 'Other',
          description: d.description || '',
          amount: d.amount || '',
          expenseDate: d.expenseDate ? d.expenseDate.substring(0, 10) : '',
          paymentMode: d.paymentMode || 'Cash',
          reference: d.reference || '',
          notes: d.notes || ''
        });
        setLoading(false);
      }).catch(() => { setLoading(false); });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) { window.alert('Description and amount are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!isEdit && company?._id) {
        payload.company = company._id;
      }
      if (isEdit) {
        await api.put(`/expenses/${id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      navigate('/expenses');
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="page-enter">
      <h4 className="fw-bold mb-4">{isEdit ? 'Edit Expense' : 'Add Expense'}</h4>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small">Category</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small">Date</label>
                <input type="date" className="form-control" value={form.expenseDate} onChange={(e) => setForm({...form, expenseDate: e.target.value})} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Amount</label>
                <input type="number" step="0.01" className="form-control" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="col-md-8">
                <label className="form-label small">Description</label>
                <input type="text" className="form-control" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Payment Mode</label>
                <select className="form-select" value={form.paymentMode} onChange={(e) => setForm({...form, paymentMode: e.target.value})}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small">Reference (Bill/Cheque No.)</label>
                <input type="text" className="form-control" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} />
              </div>
              <div className="col-md-12">
                <label className="form-label small">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}></textarea>
              </div>
            </div>
            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Expense'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/expenses')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;

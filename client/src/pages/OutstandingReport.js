import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const OutstandingReport = () => {
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        api.get('/invoices', { params: { limit: 1000 } }),
        api.get('/payments', { params: { limit: 1000 } })
      ]);
      setInvoices(invRes.data.data || []);
      setPayments(payRes.data.data || []);

      const pRes = await api.get('/parties', { params: { limit: 500 } });
      setParties(pRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load outstanding data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getOutstanding = () => {
    const partyMap = {};
    parties.forEach(p => { partyMap[p._id] = { ...p, totalInvoiced: 0, totalPaid: 0, outstanding: 0, overdueDays: 0 }; });

    invoices.forEach(inv => {
      const pId = typeof inv.party === 'object' ? inv.party?._id : inv.party;
      if (partyMap[pId]) {
        partyMap[pId].totalInvoiced += inv.grandTotal || 0;
        const paid = inv.paidAmount || 0;
        partyMap[pId].totalPaid += paid;
      }
    });

    payments.forEach(pay => {
      const pId = typeof pay.party === 'object' ? pay.party?._id : pay.party;
      if (partyMap[pId]) {
        partyMap[pId].totalPaid += pay.amount || 0;
      }
    });

    const now = new Date();
    Object.values(partyMap).forEach(p => {
      p.outstanding = Math.max(0, p.totalInvoiced - p.totalPaid);
      const lastInvoice = invoices.filter(inv => (typeof inv.party === 'object' ? inv.party?._id : inv.party) === p._id).sort((a, b) => new Date(b.dueDate || b.invoiceDate) - new Date(a.dueDate || a.invoiceDate))[0];
      if (lastInvoice?.dueDate) {
        const due = new Date(lastInvoice.dueDate);
        p.overdueDays = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
      }
    });

    return Object.values(partyMap).filter(p => p.outstanding > 0 || p.totalInvoiced > 0);
  };

  if (loading) return <Loading />;

  const outstandingData = getOutstanding();
  const filtered = outstandingData.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.companyName || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = filtered.reduce((s, p) => s + p.outstanding, 0);

  return (
    <div className="outstanding-report-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Outstanding Report</h4>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text"><i className="fas fa-search"></i></span>
                <input type="text" className="form-control" placeholder="Search by party name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-2 bg-light rounded text-center">
                <small className="text-muted">Total Outstanding</small>
                <h5 className="fw-bold text-danger mb-0">{formatCurrency(totalOutstanding)}</h5>
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
                <th>Party Name</th>
                <th>Type</th>
                <th className="text-end">Total Invoiced</th>
                <th className="text-end">Total Paid</th>
                <th className="text-end">Outstanding</th>
                <th className="text-center">Overdue (Days)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">No outstanding data found</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id} className={p.overdueDays > 30 ? 'table-danger' : p.overdueDays > 15 ? 'table-warning' : ''}>
                  <td className="fw-semibold">{p.name}</td>
                  <td><span className={`badge ${p.partyType === 'Customer' ? 'bg-primary' : 'bg-info'}`}>{p.partyType}</span></td>
                  <td className="text-end">{formatCurrency(p.totalInvoiced)}</td>
                  <td className="text-end">{formatCurrency(p.totalPaid)}</td>
                  <td className={`text-end fw-bold ${p.outstanding > 0 ? 'text-danger' : 'text-success'}`}>{formatCurrency(p.outstanding)}</td>
                  <td className="text-center">
                    {p.overdueDays > 0 ? (
                      <span className={`badge ${p.overdueDays > 30 ? 'bg-danger' : p.overdueDays > 15 ? 'bg-warning text-dark' : 'bg-info'}`}>
                        {p.overdueDays} days
                      </span>
                    ) : <span className="text-muted small">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-end mt-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}><i className="fas fa-print me-1"></i>Print</button>
      </div>
    </div>
  );
};

export default OutstandingReport;

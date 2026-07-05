import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';
const SalesReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(today);
  const [partyFilter, setPartyFilter] = useState('');
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalQty: 0, totalTaxable: 0, totalTax: 0, grandTotal: 0 });

  useEffect(() => {
    api.get('/parties', { params: { limit: 500 } }).then(res => setParties(res.data.data || [])).catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = { startDate: fromDate, endDate: toDate, party: partyFilter, limit: 500 };
      const res = await api.get('/invoices', { params });
      const invs = res.data.data || [];
      setInvoices(invs);
      const s = { totalQty: 0, totalTaxable: 0, totalTax: 0, grandTotal: 0 };
      invs.forEach(inv => {
        const taxable = inv.subtotal || 0;
        const tax = (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0);
        s.totalQty += (inv.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
        s.totalTaxable += taxable;
        s.totalTax += tax;
        s.grandTotal += inv.grandTotal || 0;
      });
      setSummary(s);
    } catch (err) {
      window.alert('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, partyFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div className="sales-report-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Sales Report</h4>
        <button className="btn btn-outline-primary" onClick={fetchReport}><i className="fas fa-sync me-1"></i>Refresh</button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">From Date</label>
              <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">To Date</label>
              <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">Party</label>
              <select className="form-select" value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)}>
                <option value="">All Parties</option>
                {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={fetchReport}><i className="fas fa-search me-1"></i>Search</button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Invoices</p>
              <h3 className="fw-bold mb-0">{invoices.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Taxable Value</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.totalTaxable)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning text-dark">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Tax</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.totalTax)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Grand Total</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.grandTotal)}</h5>
            </div>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th>Party</th>
                  <th className="text-end">Taxable</th>
                  <th className="text-end">CGST</th>
                  <th className="text-end">SGST</th>
                  <th className="text-end">IGST</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">No invoices found for the selected period</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv._id}>
                    <td className="small">{formatDate(inv.invoiceDate)}</td>
                    <td className="fw-semibold">{inv.invoiceNo}</td>
                    <td>{inv.party?.name || ''}</td>
                    <td className="text-end">{formatCurrency(inv.subtotal || 0)}</td>
                    <td className="text-end">{formatCurrency(inv.cgstTotal || 0)}</td>
                    <td className="text-end">{formatCurrency(inv.sgstTotal || 0)}</td>
                    <td className="text-end">{formatCurrency(inv.igstTotal || 0)}</td>
                    <td className="text-end fw-bold">{formatCurrency(inv.grandTotal || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="3" className="text-end">Total</td>
                  <td className="text-end">{formatCurrency(summary.totalTaxable)}</td>
                  <td className="text-end">-</td>
                  <td className="text-end">-</td>
                  <td className="text-end">-</td>
                  <td className="text-end">{formatCurrency(summary.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="text-end mt-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}><i className="fas fa-print me-1"></i>Print</button>
      </div>
    </div>
  );
};

export default SalesReport;

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const PurchaseReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(today);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [data, setData] = useState({ invoices: [], summary: {} });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/parties', { params: { type: 'Supplier', limit: 500 } }).then(res => {
      const list = res.data.data || [];
      setSuppliers(list);
    }).catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = { startDate: fromDate, endDate: toDate };
      if (supplierFilter) params.party = supplierFilter;
      const res = await api.get('/reports/purchases', { params });
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load purchase report');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, supplierFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const { invoices = [], summary = {} } = data;

  return (
    <div className="purchase-report-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Purchase Report</h4>
        <div>
          <Link to="/invoices/create?type=Purchase" className="btn btn-primary btn-sm me-2">
            <i className="fas fa-plus me-1"></i>New Purchase
          </Link>
          <button className="btn btn-outline-primary btn-sm" onClick={fetchReport}>
            <i className="fas fa-sync me-1"></i>Refresh
          </button>
        </div>
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
              <label className="form-label small fw-semibold mb-1">Supplier</label>
              <select className="form-select" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
                <option value="">All Suppliers</option>
                {suppliers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
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
              <p className="mb-0 small">Total Purchases</p>
              <h3 className="fw-bold mb-0">{summary.invoiceCount || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Taxable Value</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.totalTaxable || 0)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning text-dark">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Tax</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.totalTax || 0)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Grand Total</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.totalAmount || 0)}</h5>
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
                  <th>Supplier</th>
                  <th>GSTIN</th>
                  <th className="text-end">Taxable</th>
                  <th className="text-end">Tax</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-4 text-muted">No purchases found for the selected period</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv._id}>
                    <td className="small">{formatDate(inv.invoiceDate)}</td>
                    <td className="fw-semibold">{inv.invoiceNo}</td>
                    <td>{inv.party?.name || ''}</td>
                    <td className="small">{inv.party?.gstin || '-'}</td>
                    <td className="text-end">{formatCurrency(inv.subtotal || 0)}</td>
                    <td className="text-end">{formatCurrency((inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0))}</td>
                    <td className="text-end fw-bold">{formatCurrency(inv.grandTotal || 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light">
                <tr className="fw-bold">
                  <td colSpan="4" className="text-end">Total</td>
                  <td className="text-end">{formatCurrency(summary.totalTaxable || 0)}</td>
                  <td className="text-end">{formatCurrency(summary.totalTax || 0)}</td>
                  <td className="text-end">{formatCurrency(summary.totalAmount || 0)}</td>
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

export default PurchaseReport;

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

const PurchaseRegister = () => {
  const today     = new Date().toISOString().split('T')[0];
  const firstDay  = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const [activeTab, setActiveTab]       = useState('invoices'); // 'invoices' | 'returns'
  const [fromDate, setFromDate]         = useState(firstDay);
  const [toDate, setToDate]             = useState(today);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  const [parties, setParties]           = useState([]);
  const [invoices, setInvoices]         = useState([]);
  const [returns, setReturns]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  /* summary */
  const [invSummary, setInvSummary]     = useState({ taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  const [retSummary, setRetSummary]     = useState({ taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

  /* Load parties for filter */
  useEffect(() => {
    api.get('/parties', { params: { limit: 500, type: 'Supplier' } })
      .then(res => setParties(res.data.data || []))
      .catch(() => {
        // fallback – try without type filter
        api.get('/parties', { params: { limit: 500 } })
          .then(res => setParties(res.data.data || []))
          .catch(() => {});
      });
  }, []);

  /* Compute summary from invoice array */
  const computeSummary = (arr) => {
    return arr.reduce((s, inv) => ({
      taxable: s.taxable + (inv.subtotal || 0),
      cgst:    s.cgst    + (inv.cgstTotal || 0),
      sgst:    s.sgst    + (inv.sgstTotal || 0),
      igst:    s.igst    + (inv.igstTotal || 0),
      total:   s.total   + (inv.grandTotal || 0),
    }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  };

  /* Fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        startDate: fromDate,
        endDate:   toDate,
        limit:     1000,
        ...(supplierFilter ? { party: supplierFilter } : {}),
      };

      const res = await api.get('/invoices', { params });
      const all = res.data.data || [];

      /* Purchase invoices: Purchase Order type + any invoice from supplier-side
         We match invoiceType === 'Purchase Order' OR the party is a supplier. */
      const purchTypes = ['purchase order'];
      const retTypes   = ['debit note', 'credit note'];

      const purchInvs = all.filter(inv => {
        const t = (inv.invoiceType || '').toLowerCase();
        return purchTypes.includes(t);
      });

      const purchRets = all.filter(inv => {
        const t = (inv.invoiceType || '').toLowerCase();
        return retTypes.includes(t);
      });

      // Apply supplier name search (client-side)
      const applySearch = (arr) => {
        if (!supplierSearch.trim()) return arr;
        const q = supplierSearch.toLowerCase();
        return arr.filter(inv =>
          (inv.party?.name || '').toLowerCase().includes(q)
        );
      };

      const filteredInv = applySearch(purchInvs);
      const filteredRet = applySearch(purchRets);

      setInvoices(filteredInv);
      setReturns(filteredRet);
      setInvSummary(computeSummary(filteredInv));
      setRetSummary(computeSummary(filteredRet));
    } catch (err) {
      console.error(err);
      setError('Failed to load purchase data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, supplierFilter, supplierSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Export CSV */
  const exportCSV = (arr, filename) => {
    const headers = ['Date', 'Supplier', 'Invoice No', 'Type', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'Status'];
    const rows = arr.map(inv => [
      formatDate(inv.invoiceDate),
      inv.party?.name || '',
      inv.invoiceNo,
      inv.invoiceType,
      (inv.subtotal    || 0).toFixed(2),
      (inv.cgstTotal   || 0).toFixed(2),
      (inv.sgstTotal   || 0).toFixed(2),
      (inv.igstTotal   || 0).toFixed(2),
      (inv.grandTotal  || 0).toFixed(2),
      inv.paymentStatus || '',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ITC Summary from both invoice types */
  const itcSummary = {
    cgst:  invSummary.cgst  - retSummary.cgst,
    sgst:  invSummary.sgst  - retSummary.sgst,
    igst:  invSummary.igst  - retSummary.igst,
    total: invSummary.cgst + invSummary.sgst + invSummary.igst
           - retSummary.cgst - retSummary.sgst - retSummary.igst,
  };

  /* Table component shared by both tabs */
  const InvoiceTable = ({ data, summary, emptyMsg }) => (
    <>
      {data.length === 0 ? (
        <tr>
          <td colSpan={10} className="text-center py-4 text-muted">{emptyMsg}</td>
        </tr>
      ) : (
        data.map(inv => (
          <tr key={inv._id}>
            <td className="small">{formatDate(inv.invoiceDate)}</td>
            <td>
              <div className="fw-semibold">{inv.party?.name || '—'}</div>
              {inv.party?.gstin && <div className="small text-muted">{inv.party.gstin}</div>}
            </td>
            <td>
              <Link to={`/invoices/${inv._id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {inv.invoiceNo}
              </Link>
              <div className="small text-muted">{inv.invoiceType}</div>
            </td>
            <td className="text-end">{formatCurrency(inv.subtotal   || 0)}</td>
            <td className="text-end">{formatCurrency(inv.cgstTotal  || 0)}</td>
            <td className="text-end">{formatCurrency(inv.sgstTotal  || 0)}</td>
            <td className="text-end">{formatCurrency(inv.igstTotal  || 0)}</td>
            <td className="text-end fw-bold">{formatCurrency(inv.grandTotal || 0)}</td>
            <td className="text-center">
              <span className={`badge ${
                inv.paymentStatus === 'Paid' ? 'bg-success' :
                inv.paymentStatus === 'Partial' ? 'bg-warning' : 'bg-danger'
              }`}>
                {inv.paymentStatus || 'Unpaid'}
              </span>
            </td>
            <td className="text-center">
              <Link to={`/invoices/${inv._id}`} className="btn btn-sm btn-outline-primary" style={{ padding: '3px 10px' }}>
                <i className="fas fa-eye"></i>
              </Link>
            </td>
          </tr>
        ))
      )}
    </>
  );

  const SummaryFooter = ({ summary }) => (
    <tfoot>
      <tr style={{ background: '#f0f1f5', fontWeight: 700, borderTop: '2px solid #d1d5db' }}>
        <td colSpan={3} className="text-end">TOTAL</td>
        <td className="text-end">{formatCurrency(summary.taxable)}</td>
        <td className="text-end">{formatCurrency(summary.cgst)}</td>
        <td className="text-end">{formatCurrency(summary.sgst)}</td>
        <td className="text-end">{formatCurrency(summary.igst)}</td>
        <td className="text-end">{formatCurrency(summary.total)}</td>
        <td colSpan={2}></td>
      </tr>
    </tfoot>
  );

  return (
    <div className="purchase-register-page page-enter">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Purchase Register</h4>
          <div className="page-subtitle">Track all purchases &amp; purchase returns</div>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchData}>
          <i className="fas fa-sync me-1"></i>Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label">From Date</label>
              <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">To Date</label>
              <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Supplier</label>
              <select className="form-select" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
                <option value="">All Suppliers</option>
                {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Search Supplier Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name…"
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={fetchData} disabled={loading}>
                <i className="fas fa-search me-1"></i>Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ITC Summary card */}
      <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)' }}>
        <div className="card-body py-3">
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-shield-alt me-2" style={{ color: 'var(--primary)' }}></i>
            <h6 className="fw-bold mb-0">Input Tax Credit (ITC) Summary</h6>
            <span className="badge bg-info ms-2">Available for Offset</span>
          </div>
          <div className="row g-3">
            <div className="col-md-3 col-6">
              <div className="summary-card text-center">
                <label>CGST ITC</label>
                <h3>{formatCurrency(itcSummary.cgst)}</h3>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="summary-card text-center">
                <label>SGST ITC</label>
                <h3>{formatCurrency(itcSummary.sgst)}</h3>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="summary-card text-center">
                <label>IGST ITC</label>
                <h3>{formatCurrency(itcSummary.igst)}</h3>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="summary-card text-center">
                <label>Total ITC</label>
                <h3 style={{ color: 'var(--success)' }}>{formatCurrency(itcSummary.total)}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-danger mb-3"><i className="fas fa-exclamation-circle me-2"></i>{error}</div>}

      {/* Tabs */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <ul className="nav nav-tabs border-0 mb-0" style={{ borderBottom: 'none' }}>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                <i className="fas fa-file-invoice me-1"></i>
                Purchase Invoices
                <span className="badge bg-primary ms-2" style={{ fontSize: '0.65rem' }}>{invoices.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'returns' ? 'active' : ''}`}
                onClick={() => setActiveTab('returns')}
              >
                <i className="fas fa-undo-alt me-1"></i>
                Purchase Returns
                <span className="badge bg-danger ms-2" style={{ fontSize: '0.65rem' }}>{returns.length}</span>
              </button>
            </li>
          </ul>

          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => {
              if (activeTab === 'invoices') exportCSV(invoices, `PurchaseInvoices_${fromDate}_${toDate}.csv`);
              else exportCSV(returns, `PurchaseReturns_${fromDate}_${toDate}.csv`);
            }}
          >
            <i className="fas fa-file-csv me-1"></i>Export CSV
          </button>
        </div>

        {loading ? (
          <div className="card-body"><Loading /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Invoice No</th>
                  <th className="text-end">Taxable</th>
                  <th className="text-end">CGST</th>
                  <th className="text-end">SGST</th>
                  <th className="text-end">IGST</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'invoices' ? (
                  <InvoiceTable
                    data={invoices}
                    summary={invSummary}
                    emptyMsg="No purchase invoices found for the selected period."
                  />
                ) : (
                  <InvoiceTable
                    data={returns}
                    summary={retSummary}
                    emptyMsg="No purchase returns found for the selected period."
                  />
                )}
              </tbody>
              {activeTab === 'invoices' && invoices.length > 0 && <SummaryFooter summary={invSummary} />}
              {activeTab === 'returns'  && returns.length  > 0 && <SummaryFooter summary={retSummary} />}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseRegister;

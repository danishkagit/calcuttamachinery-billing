import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';
import Papa from 'papaparse';

const PurchaseReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(today);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [data, setData] = useState({ invoices: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);

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
      window.alert('Failed to load purchase report');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, supplierFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const { invoices = [], summary = {} } = data;

  const handleExport = async () => {
    try {
      if (invoices.length === 0) return window.alert("No purchases to export");
      
      const exportData = [];
      invoices.forEach(inv => {
        if (!inv.items || inv.items.length === 0) {
           exportData.push({
             invoiceNo: inv.invoiceNo,
             invoiceDate: inv.invoiceDate ? inv.invoiceDate.substring(0,10) : '',
             partyName: inv.party?.name || '',
             partyGstin: inv.party?.gstin || '',
             placeOfSupply: inv.placeOfSupply || '',
             invoiceType: inv.invoiceType || 'Purchase',
             paymentStatus: inv.paymentStatus || '',
             paidAmount: inv.paidAmount || 0,
             paymentMethod: inv.paymentMethod || '',
             productName: '',
             description: '',
             quantity: '',
             unit: '',
             rate: '',
             taxRate: '',
             cess: ''
           });
        } else {
           inv.items.forEach(item => {
             exportData.push({
               invoiceNo: inv.invoiceNo,
               invoiceDate: inv.invoiceDate ? inv.invoiceDate.substring(0,10) : '',
               partyName: inv.party?.name || '',
               partyGstin: inv.party?.gstin || '',
               placeOfSupply: inv.placeOfSupply || '',
               invoiceType: inv.invoiceType || 'Purchase',
               paymentStatus: inv.paymentStatus || '',
               paidAmount: inv.paidAmount || 0,
               paymentMethod: inv.paymentMethod || '',
               productName: item.product?.name || item.description || '',
               description: item.description || '',
               quantity: item.quantity,
               unit: item.unit,
               rate: item.rate,
               taxRate: item.taxRate,
               cess: item.cess
             });
           });
        }
      });

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'purchase_invoices.csv';
      a.click();
    } catch (err) {
      window.alert('Failed to export purchases');
    }
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const grouped = {};
          results.data.forEach(row => {
            if (!row.invoiceNo) return;
            if (!grouped[row.invoiceNo]) {
              grouped[row.invoiceNo] = {
                invoiceNo: row.invoiceNo,
                invoiceDate: row.invoiceDate,
                partyName: row.partyName,
                partyGstin: row.partyGstin,
                placeOfSupply: row.placeOfSupply,
                invoiceType: row.invoiceType || 'Purchase',
                paymentStatus: row.paymentStatus,
                paidAmount: row.paidAmount,
                paymentMethod: row.paymentMethod,
                items: []
              };
            }
            if (row.productName || row.description) {
              grouped[row.invoiceNo].items.push({
                productName: row.productName,
                description: row.description,
                quantity: row.quantity,
                unit: row.unit,
                rate: row.rate,
                taxRate: row.taxRate,
                cess: row.cess
              });
            }
          });

          const res = await api.post('/invoices/import', Object.values(grouped));
          window.alert(`Imported ${res.data.count} purchases successfully`);
          if (res.data.errors) {
            console.warn("Import errors:", res.data.errors);
            window.alert(`Imported with some errors. Check console.`);
          }
          fetchReport();
        } catch (err) {
          window.alert(err.response?.data?.error || 'Import failed');
        }
      }
    });
    e.target.value = null;
  };

  return (
    <div className="purchase-report-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Purchase Report</h4>
        <div className="d-flex gap-2">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileUpload} />
          <button className="btn btn-outline-success btn-sm" onClick={handleExport}><i className="fas fa-file-export me-1"></i>Export</button>
          <button className="btn btn-outline-primary btn-sm" onClick={handleImportClick}><i className="fas fa-file-import me-1"></i>Import</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchReport}>
            <i className="fas fa-sync me-1"></i>Refresh
          </button>
          <Link to="/invoices/create?type=Purchase" className="btn btn-primary btn-sm">
            <i className="fas fa-plus me-1"></i>New Purchase
          </Link>
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

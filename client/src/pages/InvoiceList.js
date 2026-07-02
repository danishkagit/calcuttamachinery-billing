import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = React.useRef(null);
  const limit = 15;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search, startDate: fromDate, endDate: toDate, paymentStatus: statusFilter };
      const res = await api.get('/invoices', { params });
      const d = res.data;
      setInvoices(d.data || []);
      setTotalPages(d.pages || 1);
      const total = (d.data || []).reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      setTotalAmount(total);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, fromDate, toDate, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/invoices/${deleteId}`);
      toast.success('Invoice deleted');
      setDeleteId(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/invoices', { params: { limit: 10000, paymentStatus: statusFilter, startDate: fromDate, endDate: toDate, search } });
      const exportData = [];
      const invs = res.data.data || [];
      if (invs.length === 0) return toast.info("No invoices to export");
      
      invs.forEach(inv => {
        if (!inv.items || inv.items.length === 0) {
           exportData.push({
             invoiceNo: inv.invoiceNo,
             invoiceDate: inv.invoiceDate ? inv.invoiceDate.substring(0,10) : '',
             partyName: inv.party?.name || '',
             partyGstin: inv.party?.gstin || '',
             placeOfSupply: inv.placeOfSupply || '',
             invoiceType: inv.invoiceType || '',
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
               invoiceType: inv.invoiceType || '',
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
      a.download = 'sales_invoices.csv';
      a.click();
    } catch (err) {
      toast.error('Failed to export invoices');
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
                invoiceType: row.invoiceType,
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
          toast.success(`Imported ${res.data.count} invoices successfully`);
          if (res.data.errors) {
            console.warn("Import errors:", res.data.errors);
            toast.warning(`Imported with some errors. Check console.`);
          }
          fetchInvoices();
        } catch (err) {
          toast.error(err.response?.data?.error || 'Import failed');
        }
      }
    });
    e.target.value = null;
  };

  return (
    <div className="invoice-list-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Invoices</h4>
        <div className="d-flex gap-2">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileUpload} />
          <button className="btn btn-outline-success" onClick={handleExport}><i className="fas fa-file-export me-1"></i>Export</button>
          <button className="btn btn-outline-primary" onClick={handleImportClick}><i className="fas fa-file-import me-1"></i>Import</button>
          <Link to="/invoices/create" className="btn btn-primary"><i className="fas fa-plus me-1"></i>Create Invoice</Link>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text"><i className="fas fa-search"></i></span>
                <input type="text" className="form-control" placeholder="Search invoice no or party..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Party Name</th>
                    <th className="text-end">Grand Total</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No invoices found</td></tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="fw-semibold">{inv.invoiceNo}</td>
                      <td className="small">{formatDate(inv.invoiceDate)}</td>
                      <td>{inv.party?.name || ''}</td>
                      <td className="text-end fw-semibold">{formatCurrency(inv.grandTotal)}</td>
                      <td className="text-center">
                        <span className={`badge ${inv.paymentStatus === 'Paid' ? 'bg-success' : inv.paymentStatus === 'Partial' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="text-center">
                        <Link to={`/invoices/${inv._id}`} className="btn btn-sm btn-outline-info me-1" title="View"><i className="fas fa-eye"></i></Link>
                        <button className="btn btn-sm btn-outline-success me-1" title="Print" onClick={() => window.open(`/invoices/${inv._id}`, '_blank')}><i className="fas fa-print"></i></button>
                        <Link to={`/invoices/edit/${inv._id}`} className="btn btn-sm btn-outline-primary me-1" title="Edit"><i className="fas fa-edit"></i></Link>
                        <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => setDeleteId(inv._id)} data-bs-toggle="modal" data-bs-target="#deleteModal"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalAmount > 0 && (
            <div className="d-flex justify-content-end mt-3">
              <div className="p-3 bg-light rounded">
                <span className="fw-semibold">Total Amount: </span>
                <span className="fw-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

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
        </>
      )}

      <div className="modal fade" id="deleteModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title fw-bold">Confirm Delete</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => setDeleteId(null)}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">Are you sure you want to delete this invoice? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;

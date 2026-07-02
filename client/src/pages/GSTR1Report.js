import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const GSTR1Report = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [b2bInvoices, setB2bInvoices] = useState([]);
  const [b2csInvoices, setB2csInvoices] = useState([]);
  const [hsnSummary, setHsnSummary] = useState([]);
  const [summary, setSummary] = useState({ totalInvoices: 0, totalTaxable: 0, totalTax: 0 });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const res = await api.get('/invoices', { params: { startDate: fromDate, endDate: toDate, limit: 1000 } });
      const invs = res.data.data || [];

      const b2b = invs.filter(inv => inv.party?.gstin);
      const b2cs = invs.filter(inv => !inv.party?.gstin);

      setB2bInvoices(b2b);
      setB2csInvoices(b2cs);

      const hsnMap = {};
      invs.forEach(inv => {
        (inv.items || []).forEach(item => {
          const hsn = item.product?.hsnCode || item.hsnCode || 'OTHER';
          if (!hsnMap[hsn]) hsnMap[hsn] = { hsnCode: hsn, description: item.description || '', uqc: item.unit || 'Nos', totalQty: 0, taxableValue: 0, taxRate: item.taxRate || 0, taxAmount: 0 };
          hsnMap[hsn].totalQty += item.quantity || 0;
          hsnMap[hsn].taxableValue += item.taxableValue || 0;
          hsnMap[hsn].taxAmount += (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
        });
      });
      setHsnSummary(Object.values(hsnMap));

      const totalTaxable = invs.reduce((s, inv) => s + (inv.subtotal || 0), 0);
      const totalTax = invs.reduce((s, inv) => s + (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0), 0);
      setSummary({ totalInvoices: invs.length, totalTaxable, totalTax });
    } catch (err) {
      toast.error('Failed to load GSTR-1 data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleDownloadJSON = async () => {
    try {
      const res = await api.get(`/gst/gstr1/${year}/${month + 1}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `GSTR1_${months[month]}_${year}.json`;
      a.click();
      toast.success("GST JSON Downloaded Successfully");
    } catch (err) {
      toast.error('Failed to download GSTR-1 JSON');
    }
  };

  return (
    <div className="gstr1-report-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">GSTR-1 Report</h4>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">Month</label>
              <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold mb-1">Year</label>
              <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[...Array(5)].map((_, i) => <option key={i} value={now.getFullYear() - i}>{now.getFullYear() - i}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={fetchReport}><i className="fas fa-search me-1"></i>Generate</button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Invoices</p>
              <h3 className="fw-bold mb-0">{summary.totalInvoices}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Taxable Value</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.totalTaxable)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body text-center py-3">
              <p className="mb-0 small">Total Tax</p>
              <h5 className="fw-bold mb-0">{formatCurrency(summary.totalTax)}</h5>
            </div>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">B2B - Registered Parties (with GSTIN)</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Party Name</th>
                    <th>GSTIN</th>
                    <th className="text-end">Taxable</th>
                    <th className="text-end">Tax</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {b2bInvoices.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-3 text-muted">No B2B invoices found</td></tr>
                  ) : b2bInvoices.map(inv => (
                    <tr key={inv._id}>
                      <td className="fw-semibold">{inv.invoiceNo}</td>
                      <td className="small">{formatDate(inv.invoiceDate)}</td>
                      <td>{inv.party?.name || ''}</td>
                      <td className="small">{inv.party?.gstin || ''}</td>
                      <td className="text-end">{formatCurrency(inv.subtotal || 0)}</td>
                      <td className="text-end">{formatCurrency((inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0))}</td>
                      <td className="text-end fw-bold">{formatCurrency(inv.grandTotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">B2CS - Consumers (without GSTIN)</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Party Name</th>
                    <th className="text-end">Taxable</th>
                    <th className="text-end">Tax</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {b2csInvoices.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-3 text-muted">No B2CS invoices found</td></tr>
                  ) : b2csInvoices.map(inv => (
                    <tr key={inv._id}>
                      <td className="fw-semibold">{inv.invoiceNo}</td>
                      <td className="small">{formatDate(inv.invoiceDate)}</td>
                      <td>{inv.party?.name || 'Consumer'}</td>
                      <td className="text-end">{formatCurrency(inv.subtotal || 0)}</td>
                      <td className="text-end">{formatCurrency((inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0))}</td>
                      <td className="text-end fw-bold">{formatCurrency(inv.grandTotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">HSN-wise Summary</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>HSN Code</th>
                    <th>Description</th>
                    <th className="text-center">UQC</th>
                    <th className="text-end">Total Qty</th>
                    <th className="text-end">Taxable Value</th>
                    <th className="text-center">Tax Rate</th>
                    <th className="text-end">Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnSummary.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-3 text-muted">No HSN data found</td></tr>
                  ) : hsnSummary.map((h, i) => (
                    <tr key={i}>
                      <td className="fw-semibold">{h.hsnCode}</td>
                      <td className="small">{h.description}</td>
                      <td className="text-center">{h.uqc}</td>
                      <td className="text-end">{h.totalQty}</td>
                      <td className="text-end">{formatCurrency(h.taxableValue)}</td>
                      <td className="text-center">{h.taxRate}%</td>
                      <td className="text-end">{formatCurrency(h.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="text-end mt-3 d-flex justify-content-end gap-2">
        <button className="btn btn-primary btn-sm" onClick={handleDownloadJSON}><i className="fas fa-download me-1"></i>Download JSON for Portal</button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}><i className="fas fa-print me-1"></i>Print</button>
      </div>
    </div>
  );
};

export default GSTR1Report;

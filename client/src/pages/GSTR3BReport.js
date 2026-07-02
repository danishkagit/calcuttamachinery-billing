import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const GSTR3BReport = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const res = await api.get('/invoices', { params: { startDate: fromDate, endDate: toDate, limit: 1000 } });
      const invoices = res.data.data || [];

      const outwardTaxable = invoices.filter(inv => inv.invoiceType !== 'Credit Note' && inv.party?.gstin);
      const outwardZero = invoices.filter(inv => inv.invoiceType !== 'Credit Note' && !inv.party?.gstin);
      const creditNotes = invoices.filter(inv => inv.invoiceType === 'Credit Note');

      const calcTotals = (invs) => {
        const taxable = invs.reduce((s, i) => s + (i.subtotal || 0), 0);
        const cgst = invs.reduce((s, i) => s + (i.cgstTotal || 0), 0);
        const sgst = invs.reduce((s, i) => s + (i.sgstTotal || 0), 0);
        const igst = invs.reduce((s, i) => s + (i.igstTotal || 0), 0);
        const cess = invs.reduce((s, i) => s + (i.cessTotal || 0), 0);
        return { taxable: Math.round(taxable * 100) / 100, cgst: Math.round(cgst * 100) / 100, sgst: Math.round(sgst * 100) / 100, igst: Math.round(igst * 100) / 100, cess: Math.round(cess * 100) / 100, total: Math.round((taxable + cgst + sgst + igst + cess) * 100) / 100 };
      };

      setData({
        period: `${months[month]} ${year}`,
        '3a': calcTotals(outwardTaxable),
        '3b': calcTotals(outwardZero),
        creditNotes: calcTotals(creditNotes),
        totalInvoices: invoices.length,
      });
    } catch (err) {
      toast.error('Failed to load GSTR-3B data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) return <Loading />;

  return (
    <div className="gstr3b-report-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">GSTR-3B Summary</h4>
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
          {data && <div className="mt-3 p-2 bg-light rounded text-center"><strong>Period:</strong> {data.period} | <strong>Total Invoices:</strong> {data.totalInvoices}</div>}
        </div>
      </div>

      {data && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">3.1(a) Outward Taxable Supplies (with GST)</h6>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Description</th>
                    <th className="text-end">Taxable Value</th>
                    <th className="text-end">CGST</th>
                    <th className="text-end">SGST</th>
                    <th className="text-end">IGST</th>
                    <th className="text-end">Cess</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Outward taxable supplies (B2B)</td>
                    <td className="text-end">{formatCurrency(data['3a'].taxable)}</td>
                    <td className="text-end">{formatCurrency(data['3a'].cgst)}</td>
                    <td className="text-end">{formatCurrency(data['3a'].sgst)}</td>
                    <td className="text-end">{formatCurrency(data['3a'].igst)}</td>
                    <td className="text-end">{formatCurrency(data['3a'].cess)}</td>
                    <td className="text-end fw-bold">{formatCurrency(data['3a'].total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">3.1(b) Outward Zero-Rated Supplies</h6>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Description</th>
                    <th className="text-end">Taxable Value</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Outward supplies to consumers (B2CS)</td>
                    <td className="text-end">{formatCurrency(data['3b'].taxable)}</td>
                    <td className="text-end fw-bold">{formatCurrency(data['3b'].total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {data.creditNotes.taxable > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h6 className="fw-bold mb-0">Credit Notes</h6>
              </div>
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Description</th>
                      <th className="text-end">Taxable Value</th>
                      <th className="text-end">CGST</th>
                      <th className="text-end">SGST</th>
                      <th className="text-end">IGST</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Credit Notes issued</td>
                      <td className="text-end">{formatCurrency(data.creditNotes.taxable)}</td>
                      <td className="text-end">{formatCurrency(data.creditNotes.cgst)}</td>
                      <td className="text-end">{formatCurrency(data.creditNotes.sgst)}</td>
                      <td className="text-end">{formatCurrency(data.creditNotes.igst)}</td>
                      <td className="text-end fw-bold">{formatCurrency(data.creditNotes.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">Total Tax Liability Summary</h6>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Description</th>
                    <th className="text-end">CGST</th>
                    <th className="text-end">SGST</th>
                    <th className="text-end">IGST</th>
                    <th className="text-end">Cess</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="fw-bold">
                    <td>Total Tax Liability</td>
                    <td className="text-end">{formatCurrency(data['3a'].cgst)}</td>
                    <td className="text-end">{formatCurrency(data['3a'].sgst)}</td>
                    <td className="text-end">{formatCurrency(data['3a'].igst)}</td>
                    <td className="text-end">{formatCurrency(data['3a'].cess)}</td>
                    <td className="text-end fs-5">{formatCurrency(data['3a'].total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="text-end mt-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}><i className="fas fa-print me-1"></i>Print</button>
      </div>
    </div>
  );
};

export default GSTR3BReport;

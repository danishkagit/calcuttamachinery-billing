import React, { useState, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();

const ProfitLossReport = () => {
  const [mode, setMode] = useState('month'); // 'month' | 'custom'
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());
  const [fromDate, setFromDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState(now.toISOString().split('T')[0]);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [report, setReport]     = useState(null);

  /* ── helpers ── */
  const getDateRange = () => {
    if (mode === 'month') {
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end   = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { startDate: start, endDate: end };
    }
    return { startDate: fromDate, endDate: toDate };
  };

  const getPeriodLabel = () => {
    if (mode === 'month') return `${months[month]} ${year}`;
    return `${formatDate(fromDate)} – ${formatDate(toDate)}`;
  };

  /* ── fetch & compute ── */
  const generateReport = useCallback(async () => {
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const { startDate, endDate } = getDateRange();

      const [salesRes, purchRes, expRes] = await Promise.all([
        api.get('/reports/sales',     { params: { startDate, endDate } }),
        api.get('/reports/purchases', { params: { startDate, endDate } }),
        api.get('/expenses',          { params: { startDate, endDate, limit: 1000 } }),
      ]);

      /* ── Income ── */
      const salesData   = salesRes.data.data   || salesRes.data   || [];
      const salesArr    = Array.isArray(salesData) ? salesData : [];

      // Try both invoice-list shape and summary shape
      let taxInvoiceSales = 0;
      let proformaTotal   = 0;

      if (salesArr.length > 0 && salesArr[0]?.invoiceType !== undefined) {
        // Array of invoice objects
        salesArr.forEach(inv => {
          const type = (inv.invoiceType || '').toLowerCase();
          const amt  = inv.grandTotal || 0;
          if (type.includes('proforma') || type.includes('quotation')) {
            proformaTotal += amt;
          } else {
            taxInvoiceSales += amt;
          }
        });
      } else if (salesRes.data.summary || salesRes.data.totalRevenue !== undefined) {
        // Summary object
        const s = salesRes.data.summary || salesRes.data;
        taxInvoiceSales = s.totalRevenue || s.grandTotal || s.total || 0;
      }

      const totalIncome = taxInvoiceSales;

      /* ── COGS ── */
      const purchData = purchRes.data.data || purchRes.data || [];
      const purchArr  = Array.isArray(purchData) ? purchData : [];

      let purchaseTotal = 0;
      if (purchArr.length > 0 && purchArr[0]?.grandTotal !== undefined) {
        purchaseTotal = purchArr.reduce((s, p) => s + (p.grandTotal || 0), 0);
      } else if (purchRes.data.summary || purchRes.data.totalPurchases !== undefined) {
        const s = purchRes.data.summary || purchRes.data;
        purchaseTotal = s.totalPurchases || s.grandTotal || s.total || 0;
      }

      const totalCOGS = purchaseTotal;

      /* ── Gross Profit ── */
      const grossProfit = totalIncome - totalCOGS;

      /* ── Expenses ── */
      const expArr = expRes.data.data || [];
      const categoryMap = {};
      expArr.forEach(e => {
        const cat = e.category || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + (e.amount || 0);
      });
      const totalExpenses = Object.values(categoryMap).reduce((s, v) => s + v, 0);

      /* ── Net Profit ── */
      const netProfit  = grossProfit - totalExpenses;
      const grossMarginPct = totalIncome > 0
        ? ((grossProfit / totalIncome) * 100).toFixed(1) : '0.0';
      const netMarginPct = totalIncome > 0
        ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

      setReport({
        period: getPeriodLabel(),
        taxInvoiceSales,
        proformaTotal,
        totalIncome,
        purchaseTotal,
        totalCOGS,
        grossProfit,
        grossMarginPct,
        categoryMap,
        totalExpenses,
        netProfit,
        netMarginPct,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, month, year, fromDate, toDate]);

  /* ── Export CSV ── */
  const exportCSV = () => {
    if (!report) return;
    const rows = [
      ['Profit & Loss Report', report.period],
      [],
      ['INCOME'],
      ['Sales (Tax Invoices)', report.taxInvoiceSales.toFixed(2)],
      ['Proforma / Quotations (info)', report.proformaTotal.toFixed(2)],
      ['Total Income', report.totalIncome.toFixed(2)],
      [],
      ['COST OF GOODS SOLD'],
      ['Purchases', report.purchaseTotal.toFixed(2)],
      ['Total COGS', report.totalCOGS.toFixed(2)],
      [],
      ['GROSS PROFIT', report.grossProfit.toFixed(2)],
      ['Gross Margin %', `${report.grossMarginPct}%`],
      [],
      ['OPERATING EXPENSES'],
      ...Object.entries(report.categoryMap).map(([cat, amt]) => [cat, amt.toFixed(2)]),
      ['Total Expenses', report.totalExpenses.toFixed(2)],
      [],
      ['NET PROFIT / LOSS', report.netProfit.toFixed(2)],
      ['Net Margin %', `${report.netMarginPct}%`],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ProfitLoss_${report.period.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── P&L row component ── */
  const PLRow = ({ label, value, bold, muted, indent, className }) => (
    <tr className={className}>
      <td style={{ paddingLeft: indent ? 32 : 16, color: muted ? 'var(--text-muted)' : 'inherit', fontWeight: bold ? 700 : 400, fontSize: muted ? '0.8rem' : '0.875rem' }}>
        {label}
      </td>
      <td className="text-end" style={{ color: muted ? 'var(--text-muted)' : 'inherit', fontWeight: bold ? 700 : 400, fontVariantNumeric: 'tabular-nums', fontSize: muted ? '0.8rem' : '0.875rem' }}>
        {formatCurrency(value)}
      </td>
    </tr>
  );

  /* ── Section header ── */
  const SectionHeader = ({ label, icon }) => (
    <tr>
      <td colSpan={2} className="pl-section-header">
        {icon && <i className={`${icon} me-2`}></i>}{label}
      </td>
    </tr>
  );

  /* ── render ── */
  return (
    <div className="pl-report-page page-enter">
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Profit &amp; Loss Report</h4>
          <div className="page-subtitle">Accounting-style P&amp;L Statement</div>
        </div>
        {report && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={exportCSV}>
              <i className="fas fa-file-csv me-1"></i>Export CSV
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
              <i className="fas fa-print me-1"></i>Print
            </button>
          </div>
        )}
      </div>

      {/* Filter card */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            {/* Mode toggle */}
            <div className="col-12 mb-1">
              <div className="d-flex gap-2">
                <button
                  className={`btn btn-sm ${mode === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('month')}
                >
                  <i className="fas fa-calendar-alt me-1"></i>Month / Year
                </button>
                <button
                  className={`btn btn-sm ${mode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('custom')}
                >
                  <i className="fas fa-calendar-range me-1"></i>Custom Range
                </button>
              </div>
            </div>

            {mode === 'month' ? (
              <>
                <div className="col-md-3">
                  <label className="form-label">Month</label>
                  <select className="form-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Year</label>
                  <select className="form-select" value={year} onChange={e => setYear(Number(e.target.value))}>
                    {[...Array(6)].map((_, i) => (
                      <option key={i} value={now.getFullYear() - i}>{now.getFullYear() - i}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="col-md-3">
                  <label className="form-label">From Date</label>
                  <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">To Date</label>
                  <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
              </>
            )}

            <div className="col-md-3">
              <button className="btn btn-primary w-100" onClick={generateReport} disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1"></span>Generating…</> : <><i className="fas fa-chart-line me-1"></i>Generate Report</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-danger mb-4"><i className="fas fa-exclamation-circle me-2"></i>{error}</div>}

      {/* Loading */}
      {loading && <Loading />}

      {/* P&L Statement */}
      {!loading && report && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-0">Profit &amp; Loss Statement</h5>
              <small className="text-muted">Period: {report.period}</small>
            </div>
            <span className="badge bg-info">Accrual Basis</span>
          </div>
          <div className="card-body p-0">
            <div className="pl-statement">
              <table className="table mb-0">
                <colgroup>
                  <col style={{ width: '70%' }} />
                  <col style={{ width: '30%' }} />
                </colgroup>
                <tbody>
                  {/* ── INCOME ── */}
                  <SectionHeader label="INCOME" icon="fas fa-arrow-up" />
                  <PLRow label="Sales (Tax Invoices)" value={report.taxInvoiceSales} indent />
                  {report.proformaTotal > 0 && (
                    <PLRow label="Proforma / Quotations (for info only)" value={report.proformaTotal} indent muted />
                  )}
                  <PLRow label="Total Income" value={report.totalIncome} bold className="pl-total-row" />

                  {/* spacer */}
                  <tr><td colSpan={2} style={{ padding: '4px 0', border: 'none' }}></td></tr>

                  {/* ── COGS ── */}
                  <SectionHeader label="COST OF GOODS SOLD" icon="fas fa-truck" />
                  <PLRow label="Purchases (from Purchase Orders)" value={report.purchaseTotal} indent />
                  <PLRow label="Total COGS" value={report.totalCOGS} bold className="pl-total-row" />

                  {/* spacer */}
                  <tr><td colSpan={2} style={{ padding: '4px 0', border: 'none' }}></td></tr>

                  {/* ── GROSS PROFIT ── */}
                  <tr className={report.grossProfit >= 0 ? 'pl-profit-positive' : 'pl-profit-negative'}>
                    <td style={{ fontWeight: 700, fontSize: '1rem', paddingLeft: 16 }}>
                      <i className={`fas fa-${report.grossProfit >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'} me-2`}></i>
                      GROSS PROFIT
                    </td>
                    <td className="text-end" style={{ fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(report.grossProfit)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 16, color: 'var(--text-muted)', fontSize: '0.78rem' }}>Gross Margin</td>
                    <td className="text-end" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{report.grossMarginPct}%</td>
                  </tr>

                  {/* spacer */}
                  <tr><td colSpan={2} style={{ padding: '4px 0', border: 'none' }}></td></tr>

                  {/* ── OPERATING EXPENSES ── */}
                  <SectionHeader label="OPERATING EXPENSES" icon="fas fa-receipt" />
                  {Object.entries(report.categoryMap).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center text-muted" style={{ paddingLeft: 32, fontSize: '0.82rem' }}>
                        No expenses recorded for this period
                      </td>
                    </tr>
                  ) : (
                    Object.entries(report.categoryMap).map(([cat, amt]) => (
                      <PLRow key={cat} label={cat} value={amt} indent />
                    ))
                  )}
                  <PLRow label="Total Expenses" value={report.totalExpenses} bold className="pl-total-row" />

                  {/* spacer */}
                  <tr><td colSpan={2} style={{ padding: '4px 0', border: 'none' }}></td></tr>

                  {/* ── NET PROFIT ── */}
                  <tr className={`pl-net-result ${report.netProfit >= 0 ? 'pl-profit-positive' : 'pl-profit-negative'}`}>
                    <td style={{ fontWeight: 800, fontSize: '1.15rem', paddingLeft: 16, letterSpacing: '0.3px' }}>
                      <i className={`fas fa-${report.netProfit >= 0 ? 'trophy' : 'exclamation-triangle'} me-2`}></i>
                      {report.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                    </td>
                    <td className="text-end" style={{ fontWeight: 800, fontSize: '1.15rem', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(Math.abs(report.netProfit))}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 16, color: 'var(--text-muted)', fontSize: '0.78rem' }}>Net Margin</td>
                    <td className="text-end" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{report.netMarginPct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary quick-view cards */}
          <div className="card-body border-top">
            <div className="row g-3">
              <div className="col-md-3 col-6">
                <div className="summary-card text-center">
                  <label>Total Income</label>
                  <h3 style={{ color: 'var(--primary)' }}>{formatCurrency(report.totalIncome)}</h3>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="summary-card text-center">
                  <label>Total COGS</label>
                  <h3 style={{ color: 'var(--warning)' }}>{formatCurrency(report.totalCOGS)}</h3>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="summary-card text-center">
                  <label>Total Expenses</label>
                  <h3 style={{ color: 'var(--danger)' }}>{formatCurrency(report.totalExpenses)}</h3>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="summary-card text-center">
                  <label>{report.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</label>
                  <h3 style={{ color: report.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatCurrency(Math.abs(report.netProfit))}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="card-body border-top d-flex justify-content-end gap-2 no-print">
            <button className="btn btn-outline-primary btn-sm" onClick={exportCSV}>
              <i className="fas fa-file-csv me-1"></i>Export CSV
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
              <i className="fas fa-print me-1"></i>Print
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !report && !error && (
        <div className="card">
          <div className="card-body text-center py-5 text-muted">
            <i className="fas fa-chart-line fa-3x mb-3" style={{ opacity: 0.25 }}></i>
            <p className="mb-0">Select a period and click <strong>Generate Report</strong> to view your P&amp;L statement.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;

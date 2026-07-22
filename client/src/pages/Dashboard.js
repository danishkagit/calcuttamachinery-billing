import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

/* ─────────────────────────────────────────────
   SVG BAR CHART — last 6 months revenue
───────────────────────────────────────────── */
const MonthlyBarChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  const W = 520, H = 200, PAD = { top: 20, right: 16, bottom: 48, left: 60 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <i className="fas fa-chart-bar fa-2x mb-2" style={{ opacity: 0.3 }}></i>
        <p className="small mb-0">No revenue data available</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const barW   = (chartW / data.length) * 0.55;
  const gap    = chartW / data.length;

  /* nice Y-axis ticks */
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((maxVal / tickCount) * i)
  );

  const fmtK = (v) => {
    if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000)   return `${(v / 100000).toFixed(1)}L`;
    if (v >= 1000)     return `${(v / 1000).toFixed(1)}K`;
    return `${v}`;
  };

  return (
    <div className="svg-bar-chart" style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', maxHeight: 220 }}
        aria-label="Monthly Revenue Bar Chart"
      >
        {/* Y grid lines + labels */}
        {yTicks.map((tick, i) => {
          const y = PAD.top + chartH - (tick / maxVal) * chartH;
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke="#e0e2e8" strokeWidth={1} strokeDasharray={i === 0 ? 'none' : '4 3'}
              />
              <text
                x={PAD.left - 6} y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {fmtK(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH  = Math.max((d.revenue / maxVal) * chartH, 2);
          const x     = PAD.left + i * gap + (gap - barW) / 2;
          const y     = PAD.top + chartH - barH;
          const isHov = hovered === i;
          return (
            <g key={i} style={{ cursor: 'pointer' }}
               onMouseEnter={() => setHovered(i)}
               onMouseLeave={() => setHovered(null)}>
              {/* Bar */}
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={4} ry={4}
                fill={isHov ? 'var(--primary-dark)' : 'var(--primary)'}
                opacity={isHov ? 1 : 0.82}
                style={{ transition: 'fill 0.15s, opacity 0.15s' }}
              />
              {/* Month label */}
              <text
                x={x + barW / 2}
                y={PAD.top + chartH + 16}
                textAnchor="middle"
                fontSize={9}
                fontWeight={isHov ? 700 : 500}
                fill={isHov ? 'var(--primary)' : 'var(--text-muted)'}
              >
                {d.label}
              </text>
              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={x + barW / 2 - 38} y={y - 30}
                    width={76} height={24}
                    rx={6} fill="var(--primary)" opacity={0.95}
                  />
                  <text
                    x={x + barW / 2} y={y - 14}
                    textAnchor="middle"
                    fontSize={8.5}
                    fontWeight={700}
                    fill="#fff"
                  >
                    {formatCurrency(d.revenue)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={PAD.left} y1={PAD.top + chartH}
          x2={PAD.left + chartW} y2={PAD.top + chartH}
          stroke="#d1d5db" strokeWidth={1.5}
        />
      </svg>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DONUT CHART — CSS conic-gradient
───────────────────────────────────────────── */
const DonutChart = ({ revenue, expenses }) => {
  const total   = revenue + expenses;
  const revPct  = total > 0 ? (revenue  / total) * 100 : 50;
  const expPct  = total > 0 ? (expenses / total) * 100 : 50;

  return (
    <div className="donut-chart-wrapper d-flex align-items-center gap-4 justify-content-center flex-wrap">
      <div
        className="donut-chart"
        style={{
          background: `conic-gradient(
            var(--primary) 0% ${revPct}%,
            var(--danger)  ${revPct}% 100%
          )`,
        }}
        role="img"
        aria-label={`Revenue ${revPct.toFixed(1)}%, Expenses ${expPct.toFixed(1)}%`}
      >
        <div className="donut-hole">
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>Net</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: revenue >= expenses ? 'var(--success)' : 'var(--danger)' }}>
            {total > 0 ? `${((revenue - expenses) / total * 100).toFixed(0)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="d-flex flex-column gap-2">
        <div className="d-flex align-items-center gap-2">
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }}></span>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Revenue</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatCurrency(revenue)}</div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)', display: 'inline-block', flexShrink: 0 }}></span>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expenses</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatCurrency(expenses)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   TOP 5 CUSTOMERS — horizontal bar list
───────────────────────────────────────────── */
const TopCustomers = ({ list }) => {
  if (!list || list.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <i className="fas fa-users fa-2x mb-2" style={{ opacity: 0.3 }}></i>
        <p className="small mb-0">No customer data this month</p>
      </div>
    );
  }
  const max = list[0][1] || 1;
  return (
    <div className="d-flex flex-column gap-2">
      {list.map(([name, amount], i) => {
        const pct = Math.max((amount / max) * 100, 2);
        return (
          <div key={name}>
            <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.78rem' }}>
              <span>
                <span className="text-muted me-1">{i + 1}.</span>
                <span className="fw-semibold" style={{ color: 'var(--text-main)' }}>{name}</span>
              </span>
              <span className="fw-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(amount)}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: '#e8ebf0', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `hsl(${230 + i * 15}, 55%, ${55 - i * 4}%)`,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [chartData, setChartData] = useState({
    monthlyRevenue: [],
    totalRevenue:   0,
    totalExpenses:  0,
    topCustomers:   [],
  });
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchChartData();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    setChartsLoading(true);
    try {
      /* Last 6 months date range */
      const endDate   = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 5);
      startDate.setDate(1);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr   = endDate.toISOString().split('T')[0];

      /* This month */
      const thisMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
        .toISOString().split('T')[0];

      const [salesRes, expRes, thisMonthInvRes] = await Promise.all([
        api.get('/invoices', { params: { startDate: startStr, endDate: endStr,      limit: 1000 } }),
        api.get('/expenses', { params: { startDate: startStr, endDate: endStr,      limit: 1000 } }),
        api.get('/invoices', { params: { startDate: thisMonthStart, endDate: endStr, limit: 1000 } }),
      ]);

      const invoices      = salesRes.data.data || [];
      const expenses      = expRes.data.data   || [];
      const thisMonthInvs = thisMonthInvRes.data.data || [];

      /* Group invoices by month */
      const monthMap = {};
      for (let i = 5; i >= 0; i--) {
        const d     = new Date();
        d.setMonth(d.getMonth() - i);
        const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short' });
        monthMap[key] = { label, revenue: 0 };
      }

      invoices.forEach(inv => {
        const d   = new Date(inv.invoiceDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap[key]) {
          monthMap[key].revenue += inv.grandTotal || 0;
        }
      });

      const monthlyRevenue = Object.values(monthMap);
      const totalRevenue   = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
      const totalExpenses  = expenses.reduce((s, e) => s + (e.amount    || 0), 0);

      /* Top 5 customers this month */
      const custMap = {};
      thisMonthInvs.forEach(inv => {
        const name = inv.party?.name || 'Unknown';
        custMap[name] = (custMap[name] || 0) + (inv.grandTotal || 0);
      });
      const topCustomers = Object.entries(custMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      setChartData({ monthlyRevenue, totalRevenue, totalExpenses, topCustomers });
    } catch (err) {
      console.error('Chart data error:', err);
    } finally {
      setChartsLoading(false);
    }
  };

  if (loading) return <Loading />;

  const stats          = data || {};
  const recentInvoices = data?.recentInvoices || [];
  const todayPayments  = data?.todayPayments  || [];

  const statCards = [
    { label: "Today's Sales",  value: stats.todaySales       || 0, icon: 'fas fa-coins',             color: 'var(--primary)' },
    { label: 'Monthly Sales',  value: stats.monthlySales     || 0, icon: 'fas fa-chart-line',        color: 'var(--success)' },
    { label: 'Parties',        value: stats.totalParties     || 0, icon: 'fas fa-users-gear',        color: 'var(--info)',    raw: true },
    { label: 'Products',       value: stats.totalProducts    || 0, icon: 'fas fa-boxes-stacked',     color: 'var(--warning)', raw: true },
    { label: 'Outstanding',    value: stats.totalOutstanding || 0, icon: 'fas fa-clock-rotate-left', color: 'var(--danger)' },
  ];

  return (
    <div className="dashboard-page">
      {/* Welcome banner */}
      <div className="dashboard-welcome">
        <div className="d-flex justify-content-between align-items-start flex-wrap" style={{ gap: 16 }}>
          <div>
            <h5 className="mb-1 d-flex align-items-center" style={{ gap: 12, color: 'var(--text-main)' }}>
              <i className="fas fa-industry" style={{ color: 'var(--primary)' }}></i>
              Calcutta Machinery
            </h5>
            <p className="mb-1" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manufactures &amp; Repairs Aluminium Sliver Can &amp; Their Accessories
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              GSTIN: 19ALUPS4733P1ZW
            </span>
          </div>
          <div className="d-none d-md-flex gap-2">
            <Link to="/invoices/create" className="btn btn-primary btn-sm">
              <i className="fas fa-plus me-1"></i>New Invoice
            </Link>
            <Link to="/parties/add" className="btn btn-outline-primary btn-sm">
              <i className="fas fa-user-plus me-1"></i>Add Party
            </Link>
            <Link to="/products/add" className="btn btn-outline-primary btn-sm">
              <i className="fas fa-box me-1"></i>Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4 mt-2">
        {statCards.map((card, i) => (
          <div className="col-xl col-md-4 col-sm-6" key={i}>
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">
                    {card.raw ? card.value : formatCurrency(card.value)}
                  </div>
                </div>
                <div className="stat-icon" style={{ background: `${card.color}18`, color: card.color }}>
                  <i className={card.icon}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="row g-4 mb-4">
        {/* Monthly Revenue Bar Chart */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <h6 className="fw-semibold mb-0">
                <i className="fas fa-chart-bar me-2" style={{ color: 'var(--primary)' }}></i>
                Monthly Revenue (Last 6 Months)
              </h6>
              <Link to="/reports/sales" className="btn btn-sm btn-outline-primary">Details</Link>
            </div>
            <div className="card-body">
              {chartsLoading ? (
                <div className="text-center py-3"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--primary)' }}></div></div>
              ) : (
                <MonthlyBarChart data={chartData.monthlyRevenue} />
              )}
            </div>
          </div>
        </div>

        {/* Donut + Top Customers stacked */}
        <div className="col-lg-5">
          <div className="row g-4 h-100">
            {/* Donut */}
            <div className="col-12">
              <div className="card">
                <div className="card-header py-2">
                  <h6 className="fw-semibold mb-0">
                    <i className="fas fa-circle-half-stroke me-2" style={{ color: 'var(--primary)' }}></i>
                    Revenue vs Expenses (6M)
                  </h6>
                </div>
                <div className="card-body py-3">
                  {chartsLoading ? (
                    <div className="text-center py-2"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--primary)' }}></div></div>
                  ) : (
                    <DonutChart
                      revenue={chartData.totalRevenue}
                      expenses={chartData.totalExpenses}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Top 5 Customers */}
            <div className="col-12">
              <div className="card">
                <div className="card-header py-2">
                  <h6 className="fw-semibold mb-0">
                    <i className="fas fa-star me-2" style={{ color: 'var(--warning)' }}></i>
                    Top 5 Customers (This Month)
                  </h6>
                </div>
                <div className="card-body py-3">
                  {chartsLoading ? (
                    <div className="text-center py-2"><div className="spinner-border spinner-border-sm" style={{ color: 'var(--primary)' }}></div></div>
                  ) : (
                    <TopCustomers list={chartData.topCustomers} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXISTING: Recent Invoices + Today Payments ── */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <h6 className="fw-semibold mb-0" style={{ color: 'var(--text-main)' }}>Recent Invoices</h6>
              <Link to="/invoices" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              {recentInvoices.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-file-invoice fa-3x mb-3" style={{ opacity: 0.3 }}></i>
                  <p>No invoices yet.</p>
                  <Link to="/invoices/create" className="btn btn-primary btn-sm">Create Invoice</Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Party</th>
                        <th className="text-end">Amount</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td>
                            <Link to={`/invoices/${inv._id}`} className="text-decoration-none fw-semibold" style={{ color: 'var(--primary)' }}>
                              {inv.invoiceNo}
                            </Link>
                          </td>
                          <td className="small">{formatDate(inv.invoiceDate)}</td>
                          <td>{inv.party?.name || ''}</td>
                          <td className="text-end fw-semibold">{formatCurrency(inv.grandTotal)}</td>
                          <td className="text-center">
                            <span className={`badge ${
                              inv.paymentStatus === 'Paid'    ? 'bg-success' :
                              inv.paymentStatus === 'Partial' ? 'bg-warning text-dark' : 'bg-danger'
                            }`}>
                              {inv.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header py-2">
              <h6 className="fw-semibold mb-0" style={{ color: 'var(--text-main)' }}>
                <i className="fas fa-credit-card me-2" style={{ color: 'var(--primary)' }}></i>
                Today's Payments
              </h6>
            </div>
            <div className="card-body">
              {todayPayments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-credit-card fa-2x mb-2" style={{ opacity: 0.3 }}></i>
                  <p className="small mb-0">No payments received today</p>
                </div>
              ) : (
                todayPayments.map((p) => (
                  <div key={p._id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <p className="mb-0 fw-semibold">{formatCurrency(p.amount)}</p>
                      <small className="text-muted">
                        {p.paymentMethod}{p.reference ? ` - ${p.reference}` : ''}
                      </small>
                    </div>
                    <span className="badge bg-light text-dark">{formatDate(p.paymentDate)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

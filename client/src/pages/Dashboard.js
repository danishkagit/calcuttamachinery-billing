import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
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

  if (loading) return <Loading />;

  const stats = data || {};
  const recentInvoices = data?.recentInvoices || [];
  const todayPayments = data?.todayPayments || [];

  const statCards = [
    { label: "Today's Sales", value: stats.todaySales || 0, icon: 'fas fa-rupee-sign', color: 'primary', bg: 'primary-subtle', delay: 1 },
    { label: 'Monthly Sales', value: stats.monthlySales || 0, icon: 'fas fa-chart-line', color: 'success', bg: 'success-subtle', delay: 2 },
    { label: 'Total Parties', value: stats.totalParties || 0, icon: 'fas fa-users', color: 'info', bg: 'info-subtle', delay: 3 },
    { label: 'Total Products', value: stats.totalProducts || 0, icon: 'fas fa-box', color: 'warning', bg: 'warning-subtle', delay: 4 },
    { label: 'Outstanding', value: stats.totalOutstanding || 0, icon: 'fas fa-clock', color: 'danger', bg: 'danger-subtle', delay: 5 },
  ];

  return (
    <div className="dashboard-page section-fade">
      <div className="dashboard-welcome">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h4 className="mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #27272a, #09090b)',
                marginRight: 10, boxShadow: '0 4px 12px rgba(9,9,11,0.15)',
                fontSize: 16, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)'
              }}>CM</span>
              Calcutta Machinery
            </h4>
            <p className="mb-2">Manufacturer of Aluminium Sliver Cans for Jute & Twine Mills</p>
            <span className="company-gstin">GSTIN: 19ALUPS4733P1ZW</span>
          </div>
          <div className="d-none d-md-flex gap-2" style={{ position: 'relative', zIndex: 1 }}>
            <Link to="/invoices/create" className="btn text-white" style={{ background: 'linear-gradient(135deg, #27272a, #09090b)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 14px rgba(9,9,11,0.15)' }}>
              <i className="fas fa-plus me-1"></i>New Invoice
            </Link>
            <Link to="/parties/add" className="btn text-white" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <i className="fas fa-user-plus me-1"></i>Add Party
            </Link>
            <Link to="/products/add" className="btn text-white" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <i className="fas fa-box me-1"></i>Add Product
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {statCards.map((card, i) => (
          <div className={`col-xl col-md-4 col-sm-6 section-fade delay-${card.delay}`} key={i}>
            <div className="stat-card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="stat-label text-muted mb-2 small">{card.label}</p>
                    <h4 className="fw-bold mb-0" style={{ fontFamily: "'Outfit', sans-serif" }}>{formatCurrency(card.value)}</h4>
                  </div>
                  <div className={`stat-icon bg-${card.bg}`}>
                    <i className={`${card.icon} text-${card.color}`} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8 section-fade delay-3">
          <div className="card h-100">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
              <h6 className="fw-bold mb-0">Recent Invoices</h6>
              <Link to="/invoices" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              {recentInvoices.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-file-invoice fa-3x mb-3" style={{ color: 'var(--primary)', opacity: 0.3 }}></i>
                  <p>No invoices yet. Create your first invoice!</p>
                  <Link to="/invoices/create" className="btn btn-primary btn-sm">Create Invoice</Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="small">Invoice #</th>
                        <th className="small">Date</th>
                        <th className="small">Party</th>
                        <th className="small text-end">Amount</th>
                        <th className="small text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td><Link to={`/invoices/${inv._id}`} className="text-decoration-none" style={{ color: 'var(--primary)' }}>{inv.invoiceNo}</Link></td>
                          <td className="small">{formatDate(inv.invoiceDate)}</td>
                          <td>{inv.party?.name || ''}</td>
                          <td className="text-end fw-semibold">{formatCurrency(inv.grandTotal)}</td>
                          <td className="text-center">
                            <span className={`badge ${inv.paymentStatus === 'Paid' ? 'bg-success' : inv.paymentStatus === 'Partial' ? 'bg-warning text-dark' : 'bg-danger'}`}>
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
        <div className="col-lg-4 section-fade delay-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-credit-card me-2" style={{ color: 'var(--primary)' }}></i>Today's Payments</h6>
            </div>
            <div className="card-body">
              {todayPayments.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, #f4f4f5, #fff)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12, boxShadow: '0 4px 12px rgba(9,9,11,0.05)',
                    border: '1px solid rgba(0,0,0,0.03)'
                  }}>
                    <i className="fas fa-credit-card" style={{ color: 'var(--primary)', fontSize: 20 }}></i>
                  </div>
                  <p className="small text-muted mb-0">No payments received today</p>
                </div>
              ) : (
                todayPayments.map((p) => (
                  <div key={p._id} className="d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <div>
                      <p className="mb-0 fw-bold" style={{ color: 'var(--success)' }}>{formatCurrency(p.amount)}</p>
                      <small className="text-muted">{p.paymentMethod}{p.reference ? ` - ${p.reference}` : ''}</small>
                    </div>
                    <span className="badge" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>{formatDate(p.paymentDate)}</span>
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

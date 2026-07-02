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
    { label: "Today's Sales", value: stats.todaySales || 0, icon: 'fas fa-rupee-sign', color: 'primary', bg: 'primary-subtle' },
    { label: 'Monthly Sales', value: stats.monthlySales || 0, icon: 'fas fa-chart-line', color: 'success', bg: 'success-subtle' },
    { label: 'Total Parties', value: stats.totalParties || 0, icon: 'fas fa-users', color: 'info', bg: 'info-subtle' },
    { label: 'Total Products', value: stats.totalProducts || 0, icon: 'fas fa-box', color: 'warning', bg: 'warning-subtle' },
    { label: 'Outstanding', value: stats.totalOutstanding || 0, icon: 'fas fa-clock', color: 'danger', bg: 'danger-subtle' },
  ];

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h4 className="mb-1">
              <img src="/logo.svg" alt="CM" style={{ width: 32, height: 32, marginRight: 10, borderRadius: 8 }} />
              Calcutta Machinery
            </h4>
            <p className="mb-2">Manufacturer of Aluminium Sliver Cans for Jute & Twine Mills — Jute Drawing with different sizes & repairs</p>
            <span className="company-gstin">GSTIN: 19ALUPS4733P1ZW</span>
          </div>
          <div className="d-none d-md-flex gap-2" style={{ position: 'relative', zIndex: 1 }}>
            <Link to="/invoices/create" className="btn btn-sm text-white" style={{ background: 'var(--primary)', border: 'none' }}>
              <i className="fas fa-plus me-1"></i>New Invoice
            </Link>
            <Link to="/parties/add" className="btn btn-sm text-white" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <i className="fas fa-user-plus me-1"></i>Add Party
            </Link>
            <Link to="/products/add" className="btn btn-sm text-white" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <i className="fas fa-box me-1"></i>Add Product
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {statCards.map((card, i) => (
          <div className="col-xl col-md-4 col-sm-6" key={i}>
            <div className={`stat-card card border-0 shadow-sm h-100`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="stat-label text-muted mb-1 small">{card.label}</p>
                    <h4 className="fw-bold mb-0">{formatCurrency(card.value)}</h4>
                  </div>
                  <div className={`stat-icon bg-${card.bg}`}>
                    <i className={`${card.icon} text-${card.color}`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
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
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0">Today's Payments</h6>
            </div>
            <div className="card-body">
              {todayPayments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-credit-card fa-2x mb-2" style={{ color: 'var(--primary)', opacity: 0.3 }}></i>
                  <p className="small mb-0">No payments received today</p>
                </div>
              ) : (
                todayPayments.map((p) => (
                  <div key={p._id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <p className="mb-0 fw-semibold small">{formatCurrency(p.amount)}</p>
                      <small className="text-muted">{p.paymentMethod} - {p.reference || ''}</small>
                    </div>
                    <small className="text-muted">{formatDate(p.paymentDate)}</small>
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

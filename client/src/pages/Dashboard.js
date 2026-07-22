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
    { label: "Today's Sales", value: stats.todaySales || 0, icon: 'fas fa-coins' },
    { label: 'Monthly Sales', value: stats.monthlySales || 0, icon: 'fas fa-chart-line' },
    { label: 'Parties', value: stats.totalParties || 0, icon: 'fas fa-users-gear' },
    { label: 'Products', value: stats.totalProducts || 0, icon: 'fas fa-boxes-stacked' },
    { label: 'Outstanding', value: stats.totalOutstanding || 0, icon: 'fas fa-clock-rotate-left' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div className="d-flex justify-content-between align-items-start flex-wrap" style={{ gap: 16 }}>
          <div>
            <h5 className="mb-1 d-flex align-items-center" style={{ gap: 12 }}>
              <i className="fas fa-industry" style={{ color: 'var(--primary)' }}></i>
              Calcutta Machinery
            </h5>
            <p className="mb-1" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manufactures & Repairs Aluminium Sliver Can & Their Accessories
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

      <div className="row g-3 mb-4 mt-2">
        {statCards.map((card, i) => (
          <div className="col-xl col-md-4 col-sm-6" key={i}>
            <div className="stat-card">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{formatCurrency(card.value)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <h6 className="fw-semibold mb-0">Recent Invoices</h6>
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
                          <td><Link to={`/invoices/${inv._id}`} className="text-decoration-none fw-semibold" style={{ color: 'var(--primary)' }}>{inv.invoiceNo}</Link></td>
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
          <div className="card">
            <div className="card-header py-2">
              <h6 className="fw-semibold mb-0"><i className="fas fa-credit-card me-2" style={{ color: 'var(--primary)' }}></i>Today's Payments</h6>
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
                      <small className="text-muted">{p.paymentMethod}{p.reference ? ` - ${p.reference}` : ''}</small>
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
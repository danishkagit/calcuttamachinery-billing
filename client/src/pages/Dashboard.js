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

  const TiltCard = ({ children, className }) => {
    const [style, setStyle] = useState({});

    const handleMouseMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;
      setStyle({
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`,
        transition: 'none',
        zIndex: 10
      });
    };

    const handleMouseLeave = () => {
      setStyle({
        transform: 'perspective(1200px) rotateX(0) rotateY(0) scale(1)',
        transition: 'transform 0.5s ease',
        zIndex: 1
      });
    };

    return (
      <div className={className} style={style} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {children}
      </div>
    );
  };

  if (loading) return <Loading />;

  const stats = data || {};
  const recentInvoices = data?.recentInvoices || [];
  const todayPayments = data?.todayPayments || [];

  const statCards = [
    { label: "Today's Sales", value: stats.todaySales || 0, icon: 'fas fa-coins', delay: 1 },
    { label: 'Monthly Sales', value: stats.monthlySales || 0, icon: 'fas fa-chart-line', delay: 2 },
    { label: 'Total Parties', value: stats.totalParties || 0, icon: 'fas fa-users-gear', delay: 3 },
    { label: 'Total Products', value: stats.totalProducts || 0, icon: 'fas fa-boxes-stacked', delay: 4 },
    { label: 'Outstanding', value: stats.totalOutstanding || 0, icon: 'fas fa-clock-rotate-left', delay: 5 },
  ];

  return (
    <div className="dashboard-page section-fade">
      <div className="dashboard-welcome">
        <div className="d-flex justify-content-between align-items-start flex-wrap" style={{ gap: 20 }}>
          <div>
            <h4 className="mb-2 d-flex align-items-center" style={{ gap: 15 }}>
              <img src="/logo.png" alt="CM" style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.95)', padding: '5px',
                objectFit: 'contain',
                boxShadow: '0 0 30px var(--primary-glow)',
                border: '2px solid rgba(212, 168, 67, 0.5)'
              }} />
              <span style={{ textShadow: '0 2px 15px rgba(212, 168, 67, 0.3)' }}>Calcutta Machinery</span>
            </h4>
            <p className="mb-2" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-industry me-2" style={{ color: 'var(--primary)' }}></i>
              Manufactures & Repairs Aluminium Sliver Can & Their Accessories
            </p>
            <span className="company-gstin">
              <i className="fas fa-id-card me-1"></i> GSTIN: 19ALUPS4733P1ZW
            </span>
          </div>
          <div className="d-none d-md-flex gap-3 align-items-center" style={{ position: 'relative', zIndex: 1 }}>
            <Link to="/invoices/create" className="btn btn-primary shadow-glow">
              <i className="fas fa-plus me-2"></i>New Invoice
            </Link>
            <Link to="/parties/add" className="btn btn-outline-primary">
              <i className="fas fa-user-plus me-2"></i>Add Party
            </Link>
            <Link to="/products/add" className="btn btn-outline-primary">
              <i className="fas fa-box me-2"></i>Add Product
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4 mt-2">
        {statCards.map((card, i) => (
          <div className={`col-xl col-md-4 col-sm-6 section-fade delay-${card.delay}`} key={i}>
            <TiltCard className="stat-card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="stat-label mb-2">{card.label}</p>
                    <h4 className="fw-bold mb-0" style={{ fontFamily: "'Outfit', sans-serif", color: '#fff' }}>{formatCurrency(card.value)}</h4>
                  </div>
                  <div className="stat-icon" style={{ background: 'var(--primary-light)', border: '1px solid var(--glass-border)' }}>
                    <i className={`${card.icon}`} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 2px 10px var(--primary-glow))' }}></i>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8 section-fade delay-3">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-file-invoice me-2" style={{ color: 'var(--primary)' }}></i>Recent Invoices</h6>
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
                          <td><Link to={`/invoices/${inv._id}`} className="text-decoration-none" style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.invoiceNo}</Link></td>
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
                    background: 'var(--primary-light)', border: '1px solid var(--glass-border)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12
                  }}>
                    <i className="fas fa-credit-card" style={{ color: 'var(--primary)', fontSize: 22 }}></i>
                  </div>
                  <p className="small text-muted mb-0">No payments received today</p>
                </div>
              ) : (
                todayPayments.map((p) => (
                  <div key={p._id} className="d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <div>
                      <p className="mb-0 fw-bold" style={{ color: '#fff' }}>{formatCurrency(p.amount)}</p>
                      <small className="text-muted">{p.paymentMethod}{p.reference ? ` - ${p.reference}` : ''}</small>
                    </div>
                    <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>{formatDate(p.paymentDate)}</span>
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

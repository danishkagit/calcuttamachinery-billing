import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Loading from '../components/Loading';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const [invRes, expRes] = await Promise.all([
        api.get('/invoices', { params: { startDate, endDate, limit: 500 } }),
        api.get('/expenses', { params: { startDate, endDate, limit: 500 } }),
      ]);

      const invoices = invRes.data.data || [];
      const expenses = expRes.data.data || [];

      const totalSales = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
      const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const netProfit = totalSales - totalExpenses;

      const categorySales = {};
      invoices.forEach(inv => {
        const type = inv.invoiceType || 'Unknown';
        categorySales[type] = (categorySales[type] || 0) + (inv.grandTotal || 0);
      });

      const categoryExpenses = {};
      expenses.forEach(exp => {
        categoryExpenses[exp.category] = (categoryExpenses[exp.category] || 0) + (exp.amount || 0);
      });

      const productSales = {};
      invoices.forEach(inv => {
        (inv.items || []).forEach(item => {
          const name = item.product?.name || item.description || 'Unknown';
          productSales[name] = (productSales[name] || 0) + (item.total || item.taxableValue || 0);
        });
      });

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const topCustomers = {};
      invoices.forEach(inv => {
        const name = inv.party?.name || 'Unknown';
        topCustomers[name] = (topCustomers[name] || 0) + (inv.grandTotal || 0);
      });
      const topCustomersList = Object.entries(topCustomers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      setData({ totalSales, totalExpenses, netProfit, categorySales, categoryExpenses, topProducts, topCustomersList, totalInvoices: invoices.length, totalExpenseCount: expenses.length });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!data) return <div className="text-center py-5 text-muted">No data available</div>;

  return (
    <div className="page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Business Analytics</h4>
        <div className="d-flex gap-1">
          {['week', 'month', 'quarter', 'year'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="stat-label">Total Sales</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(data.totalSales)}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value text-danger" style={{ fontSize: '1.3rem' }}>{formatCurrency(data.totalExpenses)}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="stat-label">Net Profit</div>
            <div className="stat-value" style={{ fontSize: '1.3rem', color: data.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(data.netProfit)}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center p-3">
            <div className="stat-label">Transactions</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{data.totalInvoices + data.totalExpenseCount}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header py-2">
              <h6 className="fw-semibold mb-0">Sales by Type</h6>
            </div>
            <div className="card-body">
              {Object.keys(data.categorySales).length === 0 ? (
                <p className="text-muted small mb-0">No sales data</p>
              ) : (
                Object.entries(data.categorySales).map(([type, amount]) => (
                  <div key={type} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="small">{type}</span>
                    <span className="fw-semibold">{formatCurrency(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header py-2">
              <h6 className="fw-semibold mb-0">Top Selling Products</h6>
            </div>
            <div className="card-body">
              {data.topProducts.length === 0 ? (
                <p className="text-muted small mb-0">No product data</p>
              ) : (
                data.topProducts.map(([name, amount], i) => (
                  <div key={name} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="small"><span className="text-muted me-2">{i + 1}.</span>{name}</span>
                    <span className="fw-semibold">{formatCurrency(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header py-2">
              <h6 className="fw-semibold mb-0">Expenses by Category</h6>
            </div>
            <div className="card-body">
              {Object.keys(data.categoryExpenses).length === 0 ? (
                <p className="text-muted small mb-0">No expense data</p>
              ) : (
                Object.entries(data.categoryExpenses).map(([cat, amount]) => (
                  <div key={cat} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="small">{cat}</span>
                    <span className="fw-semibold text-danger">{formatCurrency(amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header py-2">
              <h6 className="fw-semibold mb-0">Top Customers</h6>
            </div>
            <div className="card-body">
              {data.topCustomersList.length === 0 ? (
                <p className="text-muted small mb-0">No customer data</p>
              ) : (
                data.topCustomersList.map(([name, amount], i) => (
                  <div key={name} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="small"><span className="text-muted me-2">{i + 1}.</span>{name}</span>
                    <span className="fw-semibold">{formatCurrency(amount)}</span>
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

export default Analytics;

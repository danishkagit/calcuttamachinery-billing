import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

const CATEGORIES = ['Office Rent', 'Electricity', 'Salary', 'Transport', 'Raw Material', 'Packaging', 'Maintenance', 'Marketing', 'Insurance', 'Legal', 'Travel', 'Stationery', 'Telephone', 'Other'];

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search, startDate: fromDate, endDate: toDate };
      if (category) params.category = category;
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalAmount(res.data.totalAmount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, fromDate, toDate, category]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/expenses/${deleteId}`);
      setDeleteId(null);
      fetchExpenses();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Expenses</h4>
        <Link to="/expenses/add" className="btn btn-primary"><i className="fas fa-plus me-1"></i>Add Expense</Link>
      </div>

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <input type="text" className="form-control" placeholder="Search description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
            </div>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment</th>
                    <th className="text-end">Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No expenses found</td></tr>
                  ) : expenses.map((exp) => (
                    <tr key={exp._id}>
                      <td className="small">{formatDate(exp.expenseDate)}</td>
                      <td><span className="badge bg-light text-dark">{exp.category}</span></td>
                      <td>{exp.description}</td>
                      <td className="small">{exp.paymentMode}{exp.reference ? ` - ${exp.reference}` : ''}</td>
                      <td className="text-end fw-semibold text-danger">{formatCurrency(exp.amount)}</td>
                      <td className="text-center">
                        <Link to={`/expenses/edit/${exp._id}`} className="btn btn-sm btn-outline-primary me-1"><i className="fas fa-edit"></i></Link>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(exp._id)} data-bs-toggle="modal" data-bs-target="#deleteModal"><i className="fas fa-trash"></i></button>
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
                <span className="fw-semibold">Total: </span>
                <span className="fw-bold text-danger">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav><ul className="pagination">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}><i className="fas fa-chevron-left"></i></button></li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}><button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button></li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}><i className="fas fa-chevron-right"></i></button></li>
              </ul></nav>
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
            <div className="modal-body"><p className="mb-0">Delete this expense? This cannot be undone.</p></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal" disabled={deleting} onClick={handleDelete}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseList;

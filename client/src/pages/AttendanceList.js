import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

const AttendanceList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [labourList, setLabourList] = useState([]);
  const [labourId, setLabourId] = useState('');
  const [type, setType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, startDate: fromDate, endDate: toDate };
      if (labourId) params.labourId = labourId;
      if (type) params.type = type;
      const res = await api.get('/attendance', { params });
      setRecords(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalAmount(res.data.totalAmount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, fromDate, toDate, labourId, type]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    api.get('/labour').then(res => {
      setLabourList(res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/attendance/${deleteId}`);
      setDeleteId(null);
      fetchRecords();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Labour Attendance</h4>
        <Link to="/attendance/add" className="btn btn-primary"><i className="fas fa-plus me-1"></i>Mark Attendance</Link>
      </div>

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-3">
              <select className="form-select" value={labourId} onChange={(e) => { setLabourId(e.target.value); setPage(1); }}>
                <option value="">All Labour</option>
                {labourList.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
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
                    <th>Labour</th>
                    <th className="text-center">Type</th>
                    <th className="text-center">Hours</th>
                    <th className="text-end">Rate Used</th>
                    <th className="text-end">Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4 text-muted">No attendance records found</td></tr>
                  ) : records.map((r) => (
                    <tr key={r._id}>
                      <td className="small">{formatDate(r.date)}</td>
                      <td className="fw-semibold">{r.labourId?.name || 'Unknown'}</td>
                      <td className="text-center">
                        <span className={`badge ${r.type === 'hourly' ? 'bg-info' : 'bg-warning text-dark'}`}>
                          {r.type === 'hourly' ? 'Hourly' : 'Daily'}
                        </span>
                      </td>
                      <td className="text-center">{r.type === 'hourly' ? r.hoursWorked : '-'}</td>
                      <td className="text-end">{formatCurrency(r.rateUsed)}</td>
                      <td className="text-end fw-semibold">{formatCurrency(r.amount)}</td>
                      <td className="text-center">
                        <Link to={`/attendance/edit/${r._id}`} className="btn btn-sm btn-outline-primary me-1"><i className="fas fa-edit"></i></Link>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(r._id)} data-bs-toggle="modal" data-bs-target="#deleteModal"><i className="fas fa-trash"></i></button>
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
                <span className="fw-semibold">Total Wages: </span>
                <span className="fw-bold">{formatCurrency(totalAmount)}</span>
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
            <div className="modal-body"><p className="mb-0">Delete this attendance record? This cannot be undone.</p></div>
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

export default AttendanceList;

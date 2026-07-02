import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const PartyList = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = React.useRef(null);
  const limit = 15;

  const fetchParties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search, partyType: typeFilter };
      const res = await api.get('/parties', { params });
      setParties(res.data.data || []);
      setTotalPages(Math.ceil((res.data.count || 0) / limit) || 1);
    } catch (err) {
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { fetchParties(); }, [fetchParties]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/parties/${deleteId}`);
      toast.success('Party deleted successfully');
      setDeleteId(null);
      fetchParties();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    if (parties.length === 0) return toast.info("No parties to export");
    const csv = Papa.unparse(parties.map(p => ({
      name: p.name,
      partyType: p.partyType,
      mobile: p.mobile,
      gstin: p.gstin || '',
      state: p.state || '',
      city: p.city || '',
      address: p.address || '',
      openingBalance: p.openingBalance || 0
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parties.csv';
    a.click();
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await api.post('/parties/import', results.data);
          toast.success(`Imported ${res.data.count} parties successfully`);
          fetchParties();
        } catch (err) {
          toast.error(err.response?.data?.error || 'Import failed');
        }
      }
    });
    e.target.value = null; // reset input
  };

  return (
    <div className="party-list-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Parties / Customers</h4>
        <div className="d-flex gap-2">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFileUpload} />
          <button className="btn btn-outline-success" onClick={handleExport}><i className="fas fa-file-export me-1"></i>Export</button>
          <button className="btn btn-outline-primary" onClick={handleImportClick}><i className="fas fa-file-import me-1"></i>Import</button>
          <Link to="/parties/add" className="btn btn-primary"><i className="fas fa-plus me-1"></i>Add New</Link>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text"><i className="fas fa-search"></i></span>
                <input type="text" className="form-control" placeholder="Search by name, mobile or GSTIN..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="Customer">Customer</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Mobile</th>
                    <th>GSTIN</th>
                    <th>State</th>
                    <th className="text-center">Type</th>
                    <th className="text-end">Opening Balance</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-4 text-muted">No parties found</td></tr>
                  ) : parties.map((party) => (
                    <tr key={party._id}>
                      <td className="fw-semibold">{party.name}</td>
                      <td className="small">{party.companyName || '-'}</td>
                      <td>{party.mobile}</td>
                      <td className="small">{party.gstin || '-'}</td>
                      <td>{party.state || '-'}</td>
                      <td className="text-center"><span className={`badge ${party.partyType === 'Customer' ? 'bg-primary' : 'bg-info'}`}>{party.partyType}</span></td>
                      <td className="text-end">{formatCurrency(party.openingBalance || 0)}</td>
                      <td className="text-center">
                        <Link to={`/parties/edit/${party._id}`} className="btn btn-sm btn-outline-primary me-1"><i className="fas fa-edit"></i></Link>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteId(party._id)} data-bs-toggle="modal" data-bs-target="#deleteModal"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}><i className="fas fa-chevron-left"></i></button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}><i className="fas fa-chevron-right"></i></button>
                  </li>
                </ul>
              </nav>
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
            <div className="modal-body">
              <p className="mb-0">Are you sure you want to delete this party? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyList;

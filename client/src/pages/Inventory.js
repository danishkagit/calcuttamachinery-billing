import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [moveType, setMoveType] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const limit = 15;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, search };
      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
      setTotalPages(Math.ceil((res.data.count || 0) / limit) || 1);
    } catch (err) {
      window.alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchLowStock = useCallback(async () => {
    try {
      const res = await api.get('/inventory/low-stock');
      setLowStock(res.data.data || []);
    } catch (err) {}
  }, []);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, movementType: moveType, startDate: fromDate, endDate: toDate };
      const res = await api.get('/inventory/movements', { params });
      setMovements(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      window.alert('Failed to load movements');
    } finally {
      setLoading(false);
    }
  }, [page, moveType, fromDate, toDate]);

  useEffect(() => {
    if (activeTab === 'summary' || activeTab === 'alerts') {
      fetchProducts();
      fetchLowStock();
    }
  }, [activeTab, fetchProducts, fetchLowStock]);

  useEffect(() => {
    if (activeTab === 'movements') fetchMovements();
  }, [activeTab, fetchMovements]);

  const handleAdjust = async () => {
    if (!adjustProduct || !adjustQty) return;
    setAdjusting(true);
    try {
      await api.post('/inventory/adjustment', {
        productId: adjustProduct._id,
        quantity: Number(adjustQty),
        notes: adjustNotes
      });
      window.alert('Stock adjusted successfully');
      setShowAdjustModal(false);
      setAdjustProduct(null);
      setAdjustQty('');
      setAdjustNotes('');
      fetchProducts();
      fetchLowStock();
    } catch (err) {
      window.alert(err.response?.data?.error || 'Adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  const getStockStatus = (product) => {
    const stock = product.openingStock || 0;
    const alert = product.lowStockAlert || 5;
    if (stock <= 0) return { label: 'Out of Stock', class: 'bg-danger' };
    if (stock <= alert) return { label: 'Low Stock', class: 'bg-warning text-dark' };
    return { label: 'In Stock', class: 'bg-success' };
  };

  const tabs = [
    { key: 'summary', label: 'Stock Summary', icon: 'fas fa-list' },
    { key: 'movements', label: 'Stock Movements', icon: 'fas fa-exchange-alt' },
    { key: 'alerts', label: `Low Stock${lowStock.length > 0 ? ` (${lowStock.length})` : ''}`, icon: 'fas fa-exclamation-triangle' },
  ];

  return (
    <div className="page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><i className="fas fa-boxes me-2"></i>Inventory Management</h4>
      </div>

      <ul className="nav nav-tabs mb-4">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.key}>
            <button className={`nav-link ${activeTab === tab.key ? 'active' : ''}`} onClick={() => { setActiveTab(tab.key); setPage(1); }}>
              <i className={`${tab.icon} me-1`}></i> {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === 'summary' && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body py-3">
              <div className="row g-2 align-items-center">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text"><i className="fas fa-search"></i></span>
                    <input type="text" className="form-control" placeholder="Search by name or HSN..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                  </div>
                </div>
                <div className="col-md-auto">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="lowStockToggle" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
                    <label className="form-check-label" htmlFor="lowStockToggle">Show Low Stock Only</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? <Loading /> : (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product Name</th>
                      <th>HSN Code</th>
                      <th>Unit</th>
                      <th className="text-end">Current Stock</th>
                      <th className="text-end">Low Alert</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lowStockOnly ? lowStock : products).length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-4 text-muted">No products found</td></tr>
                    ) : (lowStockOnly ? lowStock : products).map((p) => {
                      const status = getStockStatus(p);
                      return (
                        <tr key={p._id}>
                          <td className="fw-semibold">{p.name}</td>
                          <td className="small text-muted">{p.hsnCode || '-'}</td>
                          <td>{p.unit || 'Nos'}</td>
                          <td className={`text-end fw-semibold ${p.openingStock <= (p.lowStockAlert || 5) ? 'text-danger' : ''}`}>{p.openingStock || 0}</td>
                          <td className="text-end text-muted">{p.lowStockAlert || 5}</td>
                          <td className="text-center"><span className={`badge ${status.class}`}>{status.label}</span></td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-warning" onClick={() => { setAdjustProduct(p); setShowAdjustModal(true); }}>
                              <i className="fas fa-sliders-h me-1"></i>Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      {activeTab === 'movements' && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body py-3">
              <div className="row g-2 align-items-center">
                <div className="col-md-3">
                  <select className="form-select" value={moveType} onChange={(e) => { setMoveType(e.target.value); setPage(1); }}>
                    <option value="">All Types</option>
                    <option value="sale">Sale</option>
                    <option value="purchase">Purchase</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="opening">Opening</option>
                  </select>
                </div>
                <div className="col-md-2"><input type="date" className="form-control" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} /></div>
                <div className="col-md-2"><input type="date" className="form-control" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} /></div>
              </div>
            </div>
          </div>

          {loading ? <Loading /> : (
            <div className="card border-0 shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Type</th>
                      <th className="text-end">Qty</th>
                      <th className="text-end">Balance</th>
                      <th>Invoice</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-4 text-muted">No movements found</td></tr>
                    ) : movements.map((m) => (
                      <tr key={m._id}>
                        <td className="small">{formatDate(m.createdAt)}</td>
                        <td className="fw-semibold">{m.product?.name || '-'}</td>
                        <td><span className={`badge ${m.movementType === 'sale' ? 'bg-danger' : m.movementType === 'purchase' ? 'bg-success' : m.movementType === 'adjustment' ? 'bg-warning text-dark' : 'bg-info'}`}>{m.movementType}</span></td>
                        <td className={`text-end fw-semibold ${m.quantity > 0 ? 'text-success' : 'text-danger'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                        <td className="text-end">{m.balanceAfter}</td>
                        <td className="small">{m.invoice?.invoiceNo || '-'}</td>
                        <td className="small text-muted">{m.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {activeTab === 'alerts' && (
        <>
          {loading ? <Loading /> : (
            <div className="row">
              {lowStock.length === 0 ? (
                <div className="col-12"><div className="alert alert-success mb-0">All products are adequately stocked.</div></div>
              ) : lowStock.map((p) => (
                <div className="col-md-4 mb-3" key={p._id}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0">{p.name}</h6>
                        <span className={`badge ${p.openingStock <= 0 ? 'bg-danger' : 'bg-warning text-dark'}`}>{p.openingStock <= 0 ? 'Out of Stock' : 'Low'}</span>
                      </div>
                      <div className="small text-muted mb-2">{p.hsnCode || ''} | {p.unit || 'Nos'}</div>
                      <div className="d-flex justify-content-between">
                        <span>Current Stock: <strong className={p.openingStock <= 0 ? 'text-danger' : 'text-warning'}>{p.openingStock || 0}</strong></span>
                        <span>Alert At: {p.lowStockAlert || 5}</span>
                      </div>
                      <button className="btn btn-sm btn-outline-warning mt-3 w-100" onClick={() => { setAdjustProduct(p); setShowAdjustModal(true); }}>
                        <i className="fas fa-sliders-h me-1"></i>Adjust Stock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showAdjustModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowAdjustModal(false)}></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title fw-bold">Adjust Stock: {adjustProduct?.name}</h6>
                  <button type="button" className="btn-close" onClick={() => setShowAdjustModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Current Stock</label>
                    <div className="form-control bg-light">{adjustProduct?.openingStock || 0} {adjustProduct?.unit || 'Nos'}</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Quantity Adjustment</label>
                    <input type="number" className="form-control" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="Positive to add, negative to remove" />
                    <div className="form-text">Enter a positive number to add stock, negative to remove.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Notes</label>
                    <input type="text" className="form-control" value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="Reason for adjustment" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-warning" disabled={adjusting || !adjustQty} onClick={handleAdjust}>
                    {adjusting ? 'Adjusting...' : 'Apply Adjustment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;

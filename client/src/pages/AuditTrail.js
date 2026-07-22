import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import Loading from '../components/Loading';
import { formatDate } from '../utils/helpers';

// ─── Constants ─────────────────────────────────────────────────────────────────
const RESOURCES = ['All', 'Invoice', 'Party', 'Product', 'Expense', 'Staff', 'Payment'];
const ACTIONS   = ['All', 'CREATE', 'UPDATE', 'DELETE'];
const PAGE_SIZE = 20;

// ─── Action badge config ───────────────────────────────────────────────────────
const ACTION_BADGE = {
  CREATE: { cls: 'audit-action-badge badge-create', icon: 'fas fa-plus-circle' },
  UPDATE: { cls: 'audit-action-badge badge-update', icon: 'fas fa-edit' },
  DELETE: { cls: 'audit-action-badge badge-delete', icon: 'fas fa-trash-alt' },
};

const getActionBadge = (action) =>
  ACTION_BADGE[action] || { cls: 'audit-action-badge badge-default', icon: 'fas fa-info-circle' };

// ─── JSON Diff Viewer ──────────────────────────────────────────────────────────
const JsonDiffViewer = ({ oldData, newData }) => {
  if (!oldData && !newData) {
    return <span className="text-muted small">No detail data available</span>;
  }

  const renderJson = (obj, side) => {
    if (!obj) return <span className="text-muted small">—</span>;
    try {
      const text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
      return (
        <pre className={`audit-json-block audit-json-${side}`}>
          {text}
        </pre>
      );
    } catch {
      return <span className="text-muted small">{String(obj)}</span>;
    }
  };

  // Only old data (DELETE)
  if (oldData && !newData) {
    return (
      <div>
        <div className="small fw-semibold text-danger mb-1">
          <i className="fas fa-minus-circle me-1"></i>Deleted Record
        </div>
        {renderJson(oldData, 'old')}
      </div>
    );
  }

  // Only new data (CREATE)
  if (!oldData && newData) {
    return (
      <div>
        <div className="small fw-semibold text-success mb-1">
          <i className="fas fa-plus-circle me-1"></i>Created Record
        </div>
        {renderJson(newData, 'new')}
      </div>
    );
  }

  // Both (UPDATE)
  return (
    <div className="row g-3">
      <div className="col-md-6">
        <div className="small fw-semibold text-danger mb-1">
          <i className="fas fa-arrow-left me-1"></i>Before
        </div>
        {renderJson(oldData, 'old')}
      </div>
      <div className="col-md-6">
        <div className="small fw-semibold text-success mb-1">
          <i className="fas fa-arrow-right me-1"></i>After
        </div>
        {renderJson(newData, 'new')}
      </div>
    </div>
  );
};

// ─── Format Timestamp ──────────────────────────────────────────────────────────
const formatTimestamp = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  const date = formatDate(d);
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return `${date} ${time}`;
};

// ─── Audit Row ─────────────────────────────────────────────────────────────────
const AuditRow = ({ log, isExpanded, onToggle }) => {
  const badge = getActionBadge(log.action);
  return (
    <>
      <tr
        className={`cursor-pointer ${isExpanded ? 'audit-row-expanded' : ''}`}
        onClick={onToggle}
        title="Click to expand details"
      >
        <td>
          <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
            {formatTimestamp(log.timestamp || log.createdAt)}
          </div>
        </td>
        <td>
          <span className={badge.cls}>
            <i className={`${badge.icon} me-1`}></i>
            {log.action}
          </span>
        </td>
        <td>
          <span className="badge bg-light" style={{ fontSize: '0.72rem' }}>
            {log.resource}
          </span>
        </td>
        <td className="fw-semibold" style={{ fontSize: '0.82rem' }}>
          {log.reference || log.resourceId || '—'}
        </td>
        <td style={{ fontSize: '0.82rem', maxWidth: 240 }}>
          <span className="text-truncate d-block" title={log.description}>
            {log.description || '—'}
          </span>
        </td>
        <td style={{ fontSize: '0.82rem' }}>
          {log.user?.name || log.userName || '—'}
        </td>
        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {log.ipAddress || '—'}
        </td>
        <td className="text-center">
          <i
            className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
            style={{ color: 'var(--text-muted)', fontSize: '0.75rem', transition: 'transform 0.2s' }}
          ></i>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan="8" className="p-0">
            <div className="audit-expand-row">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="fas fa-code" style={{ color: 'var(--primary)' }}></i>
                <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>Change Details</span>
                {log.action && (
                  <span className={`ms-1 ${badge.cls}`}>
                    <i className={`${badge.icon} me-1`}></i>{log.action}
                  </span>
                )}
              </div>
              <JsonDiffViewer
                oldData={log.oldValues || log.before || null}
                newData={log.newValues || log.after || null}
              />
              {log.metadata && (
                <div className="mt-3">
                  <div className="small fw-semibold text-muted mb-1">
                    <i className="fas fa-info-circle me-1"></i>Additional Info
                  </div>
                  <pre className="audit-json-block audit-json-meta">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);

    if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="d-flex justify-content-center mt-4">
      <nav>
        <ul className="pagination">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)}>
              <i className="fas fa-chevron-left"></i>
            </button>
          </li>
          {getPageNumbers().map((p, i) =>
            p === '...'
              ? <li key={`ellipsis-${i}`} className="page-item disabled"><span className="page-link">…</span></li>
              : <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
                </li>
          )}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AuditTrail = () => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Filters
  const [resource, setResource]   = useState('All');
  const [action, setAction]       = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  // Pagination
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Abort previous fetch on new filter change
  const abortRef = useRef(null);

  const fetchLogs = useCallback(async (currentPage = 1) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError('');
    setExpandedRows(new Set()); // collapse on filter change

    try {
      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
        resource: resource !== 'All' ? resource : '',
        action:   action   !== 'All' ? action   : '',
        startDate,
        endDate,
      };
      const res = await api.get('/audit', { params, signal: abortRef.current.signal });
      const data = res.data;
      setLogs(data.data || data.logs || []);
      const total = data.total || data.count || 0;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.message || 'Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  }, [resource, action, startDate, endDate]);

  // Re-fetch when filters change (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [fetchLogs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchLogs(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleClearFilters = () => {
    setResource('All');
    setAction('All');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = resource !== 'All' || action !== 'All' || startDate || endDate;

  return (
    <div className="list-page page-enter">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h4 className="page-title">
            <i className="fas fa-history me-2" style={{ color: 'var(--primary)' }}></i>
            Audit Trail
          </h4>
          <div className="page-subtitle">
            Complete history of all changes made in your account
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {totalCount > 0 && (
            <span className="badge bg-info" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
              {totalCount.toLocaleString('en-IN')} records
            </span>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card border-0 mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-sm-6 col-md-3 col-lg-2">
              <label className="form-label">Resource</label>
              <select
                className="form-select form-select-sm"
                value={resource}
                onChange={e => setResource(e.target.value)}
              >
                {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-sm-6 col-md-3 col-lg-2">
              <label className="form-label">Action</label>
              <select
                className="form-select form-select-sm"
                value={action}
                onChange={e => setAction(e.target.value)}
              >
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-sm-6 col-md-3 col-lg-2">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-sm-6 col-md-3 col-lg-2">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-sm-12 col-md-auto">
              {hasActiveFilters && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleClearFilters}
                  title="Clear all filters"
                >
                  <i className="fas fa-times me-1"></i>Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-danger mb-4">
          <i className="fas fa-exclamation-circle me-2"></i>{error}
          <button className="btn btn-sm btn-danger ms-3" onClick={() => fetchLogs(page)}>
            <i className="fas fa-redo me-1"></i>Retry
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? <Loading /> : (
        <>
          <div className="card border-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>User</th>
                    <th>IP Address</th>
                    <th className="text-center" style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <div style={{ color: 'var(--text-muted)' }}>
                          <i className="fas fa-history fa-2x mb-3 d-block"></i>
                          {hasActiveFilters
                            ? 'No audit logs match the selected filters.'
                            : 'No audit logs found yet.'
                          }
                        </div>
                      </td>
                    </tr>
                  ) : logs.map((log) => {
                    const id = log._id || log.id;
                    return (
                      <AuditRow
                        key={id}
                        log={log}
                        isExpanded={expandedRows.has(id)}
                        onToggle={() => toggleRow(id)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="table-footer mt-2">
            <span>
              Showing {logs.length} of {totalCount.toLocaleString('en-IN')} logs
              {hasActiveFilters && ' (filtered)'}
            </span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              Click any row to view change details
            </span>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default AuditTrail;

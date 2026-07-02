import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const GSTReturns = () => {
  const now = new Date();
  const [activeTab, setActiveTab] = useState('gstr1');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [gstr1Data, setGstr1Data] = useState(null);
  const [gstr3bData, setGstr3bData] = useState(null);
  const [filingHistory, setFilingHistory] = useState([]);
  const [showJson, setShowJson] = useState(false);

  const [auth, setAuth] = useState({ username: '', gstin: '', otp: '', token: '', step: 'idle' });
  const [filingAction, setFilingAction] = useState('');

  const [exportFormat, setExportFormat] = useState('json');

  const fetchGstr1 = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/gst/gstr1/${year}/${month + 1}`);
      setGstr1Data(res.data.data);
    } catch (err) {
      toast.error('Failed to generate GSTR-1 data');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const fetchGstr3b = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/gst/gstr3b/${year}/${month + 1}`);
      setGstr3bData(res.data.data);
    } catch (err) {
      toast.error('Failed to generate GSTR-3B data');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/gst/filing-history');
      setFilingHistory(res.data.data);
    } catch (err) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (activeTab === 'gstr1') fetchGstr1();
    else if (activeTab === 'gstr3b') fetchGstr3b();
    else if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchGstr1, fetchGstr3b, fetchHistory]);

  const handleRequestOtp = async () => {
    if (!auth.username || !auth.gstin) { toast.error('Enter username and GSTIN'); return; }
    try {
      await api.post('/gst/auth/request-otp', { username: auth.username, gstin: auth.gstin });
      toast.success('OTP sent to registered mobile/email');
      setAuth(prev => ({ ...prev, step: 'otp' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request OTP');
    }
  };

  const handleAuthenticate = async () => {
    if (!auth.otp) { toast.error('Enter OTP'); return; }
    try {
      const res = await api.post('/gst/auth/authenticate', {
        username: auth.username,
        password: auth.otp,
        gstin: auth.gstin
      });
      const token = res.data.data?.token || res.data.data?.auth_token || '';
      setAuth(prev => ({ ...prev, token, step: 'authenticated' }));
      toast.success('GST portal authenticated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleFileReturn = async (type) => {
    if (!auth.token) { toast.error('Authenticate with GST portal first'); return; }
    setFilingAction(type);
    try {
      const data = type === 'gstr1' ? gstr1Data : gstr3bData;
      if (!data) { toast.error('Generate return data first'); return; }
      const endpoint = type === 'gstr1' ? '/gst/gstr1/file' : '/gst/gstr3b/file';
      await api.post(endpoint, {
        token: auth.token,
        gstin: auth.gstin,
        fp: data.fp,
        returnData: data,
        action: 'file'
      });
      toast.success(`${type.toUpperCase()} filed successfully`);
      await api.post('/gst/filing-history', {
        returnType: type.toUpperCase(),
        period: `${months[month]} ${year}`,
        fp: data.fp,
        gstin: auth.gstin,
        status: 'Filed'
      });
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || `${type.toUpperCase()} filing failed`);
    } finally {
      setFilingAction('');
    }
  };

  const handleExport = () => {
    const data = activeTab === 'gstr1' ? gstr1Data : gstr3bData;
    if (!data) { toast.error('No data to export'); return; }
    const content = exportFormat === 'json' ? JSON.stringify(data, null, 2) : csvExport(data);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST${activeTab.toUpperCase()}_${months[month]}_${year}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${exportFormat.toUpperCase()}`);
  };

  const csvExport = (data) => {
    let csv = '';
    if (data.b2b) {
      csv += 'B2B Invoices\nInvoice No,Date,Party GSTIN,Taxable,CGST,SGST,IGST,Cess,Total\n';
      data.b2b.forEach(b => {
        b.inv.forEach(i => {
          csv += `${i.inum},${i.idt},${b.ctin},${i.val},0,0,0,0,${i.val}\n`;
        });
      });
    }
    return csv;
  };

  const handleSaveFilingRecord = async (status) => {
    const data = activeTab === 'gstr1' ? gstr1Data : gstr3bData;
    if (!data) { toast.error('Generate data first'); return; }
    await api.post('/gst/filing-history', {
      returnType: activeTab.toUpperCase(),
      period: `${months[month]} ${year}`,
      fp: data.fp,
      gstin: auth.gstin || 'manual',
      status
    });
    toast.success('Filing record saved');
    fetchHistory();
  };

  return (
    <div className="gst-returns-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><i className="fas fa-file-invoice me-2"></i>GST Returns</h4>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'gstr1' ? 'active fw-semibold' : ''}`} onClick={() => setActiveTab('gstr1')}>
            <i className="fas fa-file-export me-1"></i>GSTR-1
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'gstr3b' ? 'active fw-semibold' : ''}`} onClick={() => setActiveTab('gstr3b')}>
            <i className="fas fa-file-alt me-1"></i>GSTR-3B
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'history' ? 'active fw-semibold' : ''}`} onClick={() => setActiveTab('history')}>
            <i className="fas fa-history me-1"></i>Filing History
          </button>
        </li>
      </ul>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[...Array(5)].map((_, i) => <option key={i} value={now.getFullYear() - i}>{now.getFullYear() - i}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={activeTab === 'gstr1' ? fetchGstr1 : fetchGstr3b}>
            <i className="fas fa-sync me-1"></i>Generate
          </button>
        </div>
        <div className="col-md-3">
          <div className="input-group">
            <select className="form-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <button className="btn btn-outline-secondary" onClick={handleExport}>
              <i className="fas fa-download me-1"></i>Export
            </button>
          </div>
        </div>
        <div className="col-md-2">
          <button className="btn btn-outline-info w-100" onClick={() => setShowJson(!showJson)}>
            <i className="fas fa-code me-1"></i>{showJson ? 'Table' : 'Raw JSON'}
          </button>
        </div>
      </div>

      {activeTab !== 'history' && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h6 className="fw-bold mb-0"><i className="fas fa-lock me-2"></i>GST Portal Authentication</h6>
          </div>
          <div className="card-body">
            {auth.step === 'idle' && (
              <div className="row g-2 align-items-end">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">GST Portal Username</label>
                  <input type="text" className="form-control" placeholder="GST portal login ID" value={auth.username} onChange={(e) => setAuth({ ...auth, username: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">GSTIN</label>
                  <input type="text" className="form-control" placeholder="15-digit GSTIN" value={auth.gstin} onChange={(e) => setAuth({ ...auth, gstin: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <button className="btn btn-primary w-100" onClick={handleRequestOtp}><i className="fas fa-envelope me-1"></i>Request OTP</button>
                </div>
              </div>
            )}
            {auth.step === 'otp' && (
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">OTP</label>
                  <input type="text" className="form-control" placeholder="Enter OTP" value={auth.otp} onChange={(e) => setAuth({ ...auth, otp: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <button className="btn btn-success w-100" onClick={handleAuthenticate}><i className="fas fa-check me-1"></i>Verify & Login</button>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100" onClick={() => setAuth({ username: '', gstin: '', otp: '', token: '', step: 'idle' })}>Cancel</button>
                </div>
              </div>
            )}
            {auth.step === 'authenticated' && (
              <div className="d-flex align-items-center gap-3">
                <span className="badge bg-success fs-6 px-3 py-2"><i className="fas fa-check-circle me-1"></i>Authenticated</span>
                <small className="text-muted">GSTIN: {auth.gstin} | Session active for 6 hours</small>
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => setAuth({ username: '', gstin: '', otp: '', token: '', step: 'idle' })}>
                  <i className="fas fa-sign-out-alt me-1"></i>Logout
                </button>
              </div>
            )}
            <div className="mt-2">
              <small className="text-muted">Authenticate with your GST portal credentials to enable API-based filing. <strong>Credentials are not stored.</strong></small>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gstr1' && (
        loading ? <Loading /> : gstr1Data && (
          <>
            {showJson ? (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <pre className="mb-0" style={{ maxHeight: '500px', overflow: 'auto', fontSize: '0.75rem', background: '#f8f9fc', padding: '16px', borderRadius: '8px' }}>{JSON.stringify(gstr1Data, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">Total Invoices</p>
                        <h3 className="fw-bold mb-0">{gstr1Data.summary?.totalInvoices || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-success text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">B2B</p>
                        <h3 className="fw-bold mb-0">{gstr1Data.summary?.b2bCount || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-info text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">B2CS</p>
                        <h3 className="fw-bold mb-0">{gstr1Data.summary?.b2csCount || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-warning text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">Total Value</p>
                        <h5 className="fw-bold mb-0">{formatCurrency(gstr1Data.summary?.totalValue || 0)}</h5>
                      </div>
                    </div>
                  </div>
                </div>

                {gstr1Data.b2b?.length > 0 && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                      <h6 className="fw-bold mb-0">B2B Invoices (Registered Parties)</h6>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Invoice No</th>
                            <th>Date</th>
                            <th>Party GSTIN</th>
                            <th className="text-end">Value</th>
                            <th className="text-end">Items</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gstr1Data.b2b.map((b, i) => b.inv.map((inv, j) => (
                            <tr key={`${i}-${j}`}>
                              <td className="fw-semibold">{inv.inum}</td>
                              <td>{inv.idt}</td>
                              <td className="small">{b.ctin}</td>
                              <td className="text-end">{formatCurrency(inv.val)}</td>
                              <td className="text-end">{inv.itms?.length || 0}</td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {gstr1Data.b2cs?.length > 0 && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                      <h6 className="fw-bold mb-0">B2CS (Unregistered Consumers)</h6>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-center">Tax Rate</th>
                            <th className="text-end">Taxable Value</th>
                            <th className="text-end">CGST</th>
                            <th className="text-end">SGST</th>
                            <th className="text-end">IGST</th>
                            <th className="text-end">Cess</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gstr1Data.b2cs.map((b, i) => (
                            <tr key={i}>
                              <td className="text-center">{b.rt}%</td>
                              <td className="text-end">{formatCurrency(b.txval)}</td>
                              <td className="text-end">{formatCurrency(b.camt)}</td>
                              <td className="text-end">{formatCurrency(b.samt)}</td>
                              <td className="text-end">{formatCurrency(b.iamt)}</td>
                              <td className="text-end">{formatCurrency(b.csamt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {gstr1Data.hsn?.length > 0 && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                      <h6 className="fw-bold mb-0">HSN-wise Summary</h6>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>HSN Code</th>
                            <th>Description</th>
                            <th>UQC</th>
                            <th className="text-end">Qty</th>
                            <th className="text-end">Taxable</th>
                            <th className="text-end">CGST</th>
                            <th className="text-end">SGST</th>
                            <th className="text-end">IGST</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gstr1Data.hsn.map((h, i) => (
                            <tr key={i}>
                              <td className="fw-semibold">{h.hsn_sc}</td>
                              <td className="small">{h.desc}</td>
                              <td>{h.uqc}</td>
                              <td className="text-end">{h.qty}</td>
                              <td className="text-end">{formatCurrency(h.txval)}</td>
                              <td className="text-end">{formatCurrency(h.camt)}</td>
                              <td className="text-end">{formatCurrency(h.samt)}</td>
                              <td className="text-end">{formatCurrency(h.iamt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {gstr1Data.cdnr?.length > 0 && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                      <h6 className="fw-bold mb-0">Credit/Debit Notes (Registered)</h6>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Note No</th>
                            <th>Date</th>
                            <th>Party GSTIN</th>
                            <th className="text-center">Type</th>
                            <th className="text-end">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gstr1Data.cdnr.map((c, i) => c.nt.map((n, j) => (
                            <tr key={`${i}-${j}`}>
                              <td className="fw-semibold">{n.nt_num}</td>
                              <td>{n.nt_dt}</td>
                              <td className="small">{c.ctin}</td>
                              <td className="text-center">{n.ntty === 'C' ? <span className="badge bg-warning text-dark">CN</span> : <span className="badge bg-info">DN</span>}</td>
                              <td className="text-end">{formatCurrency(n.val)}</td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-end mt-3">
                  <button className="btn btn-success" disabled={!auth.token || !!filingAction} onClick={() => handleFileReturn('gstr1')}>
                    {filingAction === 'gstr1' ? <><span className="spinner-border spinner-border-sm me-1"></span>Filing...</> : <><i className="fas fa-upload me-1"></i>File GSTR-1</>}
                  </button>
                  <button className="btn btn-outline-success" onClick={() => handleSaveFilingRecord('Filed (Manual)')}>
                    <i className="fas fa-check me-1"></i>Mark as Filed
                  </button>
                </div>
              </>
            )}
          </>
        )
      )}

      {activeTab === 'gstr3b' && (
        loading ? <Loading /> : gstr3bData && (
          <>
            {showJson ? (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <pre className="mb-0" style={{ maxHeight: '500px', overflow: 'auto', fontSize: '0.75rem', background: '#f8f9fc', padding: '16px', borderRadius: '8px' }}>{JSON.stringify(gstr3bData, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-primary text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">Total Invoices</p>
                        <h3 className="fw-bold mb-0">{gstr3bData.totalInvoices || 0}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-success text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">Total Taxable</p>
                        <h5 className="fw-bold mb-0">{formatCurrency(gstr3bData.totalTxval?.taxable || 0)}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-info text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">Total Tax</p>
                        <h5 className="fw-bold mb-0">{formatCurrency((gstr3bData.totalTxval?.igst || 0) + (gstr3bData.totalTxval?.cgst || 0) + (gstr3bData.totalTxval?.sgst || 0) + (gstr3bData.totalTxval?.cess || 0))}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 shadow-sm bg-warning text-white">
                      <div className="card-body text-center py-3">
                        <p className="mb-0 small">Period</p>
                        <h6 className="fw-bold mb-0">{months[month]} {year}</h6>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h6 className="fw-bold mb-0">3.1(a) Outward Taxable Supplies (B2B - Intra-State)</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-end">Taxable Value</th>
                          <th className="text-end">CGST</th>
                          <th className="text-end">SGST</th>
                          <th className="text-end">IGST</th>
                          <th className="text-end">Cess</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.txval || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.camt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.samt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.iamt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.csamt || 0)}</td>
                          <td className="text-end fw-bold">{formatCurrency(
                            (gstr3bData.sup_details?.osup_det?.txval || 0) +
                            (gstr3bData.sup_details?.osup_det?.camt || 0) +
                            (gstr3bData.sup_details?.osup_det?.samt || 0) +
                            (gstr3bData.sup_details?.osup_det?.iamt || 0) +
                            (gstr3bData.sup_details?.osup_det?.csamt || 0)
                          )}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h6 className="fw-bold mb-0">3.1(b) Zero Rated / Inter-State Supplies</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-end">Taxable Value</th>
                          <th className="text-end">IGST</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_zero?.txval || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_zero?.iamt || 0)}</td>
                          <td className="text-end fw-bold">{formatCurrency((gstr3bData.sup_details?.osup_zero?.txval || 0) + (gstr3bData.sup_details?.osup_zero?.iamt || 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h6 className="fw-bold mb-0">4 - ITC Claimed (Inward Supplies from Suppliers)</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ITC Type</th>
                          <th className="text-end">IGST</th>
                          <th className="text-end">CGST</th>
                          <th className="text-end">SGST</th>
                          <th className="text-end">Cess</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gstr3bData.itc_elg?.itc_avl?.map((t, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">{t.ty}</td>
                            <td className="text-end">{formatCurrency(t.iamt)}</td>
                            <td className="text-end">{formatCurrency(t.camt)}</td>
                            <td className="text-end">{formatCurrency(t.samt)}</td>
                            <td className="text-end">{formatCurrency(t.csamt)}</td>
                          </tr>
                        ))}
                        <tr className="fw-bold table-active">
                          <td>Total ITC</td>
                          <td className="text-end">{formatCurrency(gstr3bData.itc_elg?.itc_avl?.reduce((s, t) => s + t.iamt, 0) || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.itc_elg?.itc_avl?.reduce((s, t) => s + t.camt, 0) || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.itc_elg?.itc_avl?.reduce((s, t) => s + t.samt, 0) || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.itc_elg?.itc_avl?.reduce((s, t) => s + t.csamt, 0) || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white py-3">
                    <h6 className="fw-bold mb-0">5 - Inward Supplies (Reverse Charge)</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-end">Taxable Value</th>
                          <th className="text-end">IGST</th>
                          <th className="text-end">CGST</th>
                          <th className="text-end">SGST</th>
                          <th className="text-end">Cess</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.isup_rev?.txval || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.isup_rev?.iamt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.isup_rev?.camt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.isup_rev?.samt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.isup_rev?.csamt || 0)}</td>
                          <td className="text-end fw-bold">{formatCurrency((gstr3bData.sup_details?.isup_rev?.txval || 0) + (gstr3bData.sup_details?.isup_rev?.iamt || 0) + (gstr3bData.sup_details?.isup_rev?.camt || 0) + (gstr3bData.sup_details?.isup_rev?.samt || 0) + (gstr3bData.sup_details?.isup_rev?.csamt || 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white py-3">
                    <h6 className="fw-bold mb-0">Total Tax Liability Summary</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Head</th>
                          <th className="text-end">Taxable Value</th>
                          <th className="text-end">IGST</th>
                          <th className="text-end">CGST</th>
                          <th className="text-end">SGST</th>
                          <th className="text-end">Cess</th>
                          <th className="text-end">Total Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-semibold">Outward (B2B)</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.txval || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.iamt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.camt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.samt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_det?.csamt || 0)}</td>
                          <td className="text-end fw-bold">{formatCurrency((gstr3bData.sup_details?.osup_det?.camt || 0) + (gstr3bData.sup_details?.osup_det?.samt || 0) + (gstr3bData.sup_details?.osup_det?.iamt || 0) + (gstr3bData.sup_details?.osup_det?.csamt || 0))}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Outward (Zero/Inter-State)</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_zero?.txval || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_zero?.iamt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_zero?.camt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_zero?.samt || 0)}</td>
                          <td className="text-end">{formatCurrency(gstr3bData.sup_details?.osup_zero?.csamt || 0)}</td>
                          <td className="text-end fw-bold">{formatCurrency((gstr3bData.sup_details?.osup_zero?.camt || 0) + (gstr3bData.sup_details?.osup_zero?.samt || 0) + (gstr3bData.sup_details?.osup_zero?.iamt || 0) + (gstr3bData.sup_details?.osup_zero?.csamt || 0))}</td>
                        </tr>
                        <tr className="table-active fw-bold">
                          <td>Total Tax Liability</td>
                          <td className="text-end">{formatCurrency((gstr3bData.sup_details?.osup_det?.txval || 0) + (gstr3bData.sup_details?.osup_zero?.txval || 0))}</td>
                          <td className="text-end">{formatCurrency((gstr3bData.sup_details?.osup_det?.iamt || 0) + (gstr3bData.sup_details?.osup_zero?.iamt || 0))}</td>
                          <td className="text-end">{formatCurrency((gstr3bData.sup_details?.osup_det?.camt || 0) + (gstr3bData.sup_details?.osup_zero?.camt || 0))}</td>
                          <td className="text-end">{formatCurrency((gstr3bData.sup_details?.osup_det?.samt || 0) + (gstr3bData.sup_details?.osup_zero?.samt || 0))}</td>
                          <td className="text-end">{formatCurrency((gstr3bData.sup_details?.osup_det?.csamt || 0) + (gstr3bData.sup_details?.osup_zero?.csamt || 0))}</td>
                          <td className="text-end fs-5" style={{ color: '#e94560' }}>{formatCurrency(
                            (gstr3bData.sup_details?.osup_det?.camt || 0) + (gstr3bData.sup_details?.osup_det?.samt || 0) + (gstr3bData.sup_details?.osup_det?.iamt || 0) + (gstr3bData.sup_details?.osup_det?.csamt || 0) +
                            (gstr3bData.sup_details?.osup_zero?.camt || 0) + (gstr3bData.sup_details?.osup_zero?.samt || 0) + (gstr3bData.sup_details?.osup_zero?.iamt || 0) + (gstr3bData.sup_details?.osup_zero?.csamt || 0)
                          )}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button className="btn btn-success" disabled={!auth.token || !!filingAction} onClick={() => handleFileReturn('gstr3b')}>
                    {filingAction === 'gstr3b' ? <><span className="spinner-border spinner-border-sm me-1"></span>Filing...</> : <><i className="fas fa-upload me-1"></i>File GSTR-3B</>}
                  </button>
                  <button className="btn btn-outline-success" onClick={() => handleSaveFilingRecord('Filed (Manual)')}>
                    <i className="fas fa-check me-1"></i>Mark as Filed
                  </button>
                </div>
              </>
            )}
          </>
        )
      )}

      {activeTab === 'history' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0"><i className="fas fa-history me-2"></i>Filing History</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={fetchHistory}><i className="fas fa-sync me-1"></i>Refresh</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Return Type</th>
                  <th>Period</th>
                  <th>GSTIN</th>
                  <th>Status</th>
                  <th>Filed At</th>
                </tr>
              </thead>
              <tbody>
                {filingHistory.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No filing history yet</td></tr>
                ) : filingHistory.map(r => (
                  <tr key={r._id}>
                    <td className="fw-semibold">{r.returnType}</td>
                    <td>{r.period}</td>
                    <td className="small">{r.gstin}</td>
                    <td><span className={`badge ${r.status === 'Filed' ? 'bg-success' : r.status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>{r.status}</span></td>
                    <td className="small">{new Date(r.filedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTReturns;

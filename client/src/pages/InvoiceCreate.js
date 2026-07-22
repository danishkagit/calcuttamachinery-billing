import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useCompany } from '../context/CompanyContext';
import { formatCurrency, amountInWords, getStateCode, INDIAN_STATES, TAX_RATES, INVOICE_TYPES, UNITS } from '../utils/helpers';
import Loading from '../components/Loading';

const emptyItem = { product: '', description: '', hsnCode: '', quantity: 1, unit: 'Nos', rate: 0, taxableValue: 0, taxRate: 18, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 };

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { company } = useCompany();
  const typeParam = searchParams.get('type');
  const isPurchase = typeParam === 'Purchase';
  const isPurchaseOrder = typeParam === 'Purchase Order';
  const isCreditNote = typeParam === 'Credit Note';
  const defaultPartyType = (isPurchase || isPurchaseOrder) ? 'Supplier' : 'Customer';
  const defaultInvoiceType = isCreditNote ? 'Credit Note' : isPurchaseOrder ? 'Purchase Order' : isPurchase ? 'Tax Invoice' : 'Tax Invoice';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(true);
  const [partySearch, setPartySearch] = useState('');
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showNewPartyModal, setShowNewPartyModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [companyState, setCompanyState] = useState('');
  const [companyStateCode, setCompanyStateCode] = useState(0);
  const partySearchRef = useRef(null);

  const [form, setForm] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceType: defaultInvoiceType,
    placeOfSupply: '',
    notes: '',
    termsAndConditions: '',
    transportMode: '',
    transportName: '',
    vehicleNo: '',
    eWayBillNo: '',
    paymentStatus: 'Unpaid',
    items: [{ ...emptyItem }],
    subtotal: 0, cgstTotal: 0, sgstTotal: 0, igstTotal: 0, cessTotal: 0, grandTotal: 0, roundOff: 0, totalTax: 0, amountInWords: ''
  });

  useEffect(() => {
    if (company) {
      setCompanyState(company.state || '');
      setCompanyStateCode(company.stateCode || 0);
    }
    loadParties();
    loadProducts();
    setLoading(false);

    // Auto-collapse sidebar on mount to give more space for data entry
    document.body.classList.add('sidebar-collapsed');
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [company]);

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-collapsed');
    setSidebarHidden(document.body.classList.contains('sidebar-collapsed'));
  };

  const loadParties = async (search = '') => {
    try {
      const params = { limit: 20, type: defaultPartyType };
      if (search) params.search = search;
      const res = await api.get('/parties', { params });
      setParties(res.data.data || []);
    } catch (err) { /* ignore */ }
  };

  const loadProducts = async (search = '') => {
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
    } catch (err) { /* ignore */ }
  };

  const handlePartySearch = (val) => {
    setPartySearch(val);
    if (val.length > 0) {
      loadParties(val);
    } else {
      loadParties();
    }
  };

  const selectParty = (party) => {
    setSelectedParty(party);
    setPartySearch(`${party.name} (${party.mobile})`);
    const isInterState = party.stateCode && companyStateCode && party.stateCode !== companyStateCode;
    setForm(prev => ({
      ...prev,
      placeOfSupply: isInterState ? party.state : companyState,
    }));
    recalcItems(party);
  };

  const recalcItems = (party) => {
    setForm(prev => {
      const pty = party || selectedParty;
      const isInterState = pty?.stateCode && companyStateCode && pty.stateCode !== companyStateCode;
      const newItems = prev.items.map(item => recalcItem(item, isInterState));
      return { ...prev, items: newItems };
    });
  };

  const recalcItem = (item, isInterState) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const taxRate = Number(item.taxRate) || 0;
    const taxableValue = qty * rate;
    let cgst = 0, sgst = 0, igst = 0;
    if (taxRate > 0) {
      if (isInterState === null) isInterState = selectedParty?.stateCode && companyStateCode && selectedParty.stateCode !== companyStateCode;
      if (isInterState) {
        igst = (taxableValue * taxRate) / 100;
      } else {
        cgst = (taxableValue * taxRate) / 200;
        sgst = (taxableValue * taxRate) / 200;
      }
    }
    const total = taxableValue + cgst + sgst + igst + (Number(item.cess) || 0);
    return { ...item, taxableValue: Math.round(taxableValue * 100) / 100, cgst: Math.round(cgst * 100) / 100, sgst: Math.round(sgst * 100) / 100, igst: Math.round(igst * 100) / 100, total: Math.round(total * 100) / 100 };
  };

  const updateTotals = (items) => {
    const subtotal = items.reduce((s, i) => s + (i.taxableValue || 0), 0);
    const cgstTotal = items.reduce((s, i) => s + (i.cgst || 0), 0);
    const sgstTotal = items.reduce((s, i) => s + (i.sgst || 0), 0);
    const igstTotal = items.reduce((s, i) => s + (i.igst || 0), 0);
    const cessTotal = items.reduce((s, i) => s + (i.cess || 0), 0);
    const totalWithoutRound = items.reduce((s, i) => s + (i.total || 0), 0);
    const roundOff = Math.round(totalWithoutRound) - totalWithoutRound;
    const grandTotal = Math.round(totalWithoutRound);
    const totalTax = cgstTotal + sgstTotal + igstTotal;
    return { subtotal: Math.round(subtotal * 100) / 100, cgstTotal: Math.round(cgstTotal * 100) / 100, sgstTotal: Math.round(sgstTotal * 100) / 100, igstTotal: Math.round(igstTotal * 100) / 100, cessTotal: Math.round(cessTotal * 100) / 100, grandTotal, roundOff: Math.round(roundOff * 100) / 100, totalTax: Math.round(totalTax * 100) / 100, amountInWords: amountInWords(grandTotal) };
  };

  const handleItemChange = (index, field, value) => {
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'product') {
        const prod = products.find(p => p._id === value);
        if (prod) {
          newItems[index] = { ...newItems[index], description: prod.name, hsnCode: prod.hsnCode || '', unit: prod.unit, rate: prod.sellingPrice, taxRate: prod.taxRate, cess: prod.cess || 0 };
        }
      }
      if (['quantity', 'rate', 'taxRate', 'cess', 'product'].includes(field)) {
        const isInterState = selectedParty?.stateCode && companyStateCode && selectedParty.stateCode !== companyStateCode;
        newItems[index] = recalcItem(newItems[index], isInterState);
      }
      const totals = updateTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }]
    }));
  };

  const removeItem = (index) => {
    if (form.items.length === 1) {
      window.alert('At least one item is required');
      return;
    }
    setForm(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totals = updateTotals(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  };

  const handleProductSearch = (val) => {
    setProductSearch(val);
    if (val.length > 0) {
      loadProducts(val);
      setShowProductDropdown(true);
    } else {
      loadProducts();
      setShowProductDropdown(false);
    }
  };

  const selectProduct = (prod, index) => {
    handleItemChange(index, 'product', prod._id);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleSubmit = async (saveAndPrint = false) => {
    if (!selectedParty) {
      window.alert('Please select a party');
      return;
    }
    if (form.items.length === 0 || form.items.every(i => !i.quantity || !i.rate)) {
      window.alert('Add at least one item with quantity and rate');
      return;
    }
    if (form.invoiceDate && form.dueDate && new Date(form.dueDate) < new Date(form.invoiceDate)) {
      window.alert('Due date must be after invoice date');
      return;
    }

    setSaving(true);
    const isInterState = selectedParty?.stateCode && companyStateCode && selectedParty.stateCode !== companyStateCode;
    const payload = {
      ...form,
      party: selectedParty._id,
      company: company?._id,
      items: form.items.map(i => ({
        product: i.product || undefined,
        description: i.description,
        quantity: Number(i.quantity),
        unit: i.unit,
        rate: Number(i.rate),
        taxableValue: i.taxableValue,
        taxRate: Number(i.taxRate),
        cgst: isInterState ? 0 : i.cgst,
        sgst: isInterState ? 0 : i.sgst,
        igst: isInterState ? i.igst : 0,
        cess: Number(i.cess) || 0,
        total: i.total
      })),
      subtotal: form.subtotal,
      cgstTotal: isInterState ? 0 : form.cgstTotal,
      sgstTotal: isInterState ? 0 : form.sgstTotal,
      igstTotal: isInterState ? form.igstTotal : 0,
      cessTotal: form.cessTotal,
      grandTotal: form.grandTotal,
      roundOff: form.roundOff,
      amountInWords: form.amountInWords,
    };

    try {
      const res = await api.post('/invoices', payload);
      const createdInvoice = res.data.data;
      window.alert('Invoice created successfully');
      if (saveAndPrint) {
        window.open(`/invoices/${createdInvoice._id}`, '_blank');
      }
      navigate(`/invoices/${createdInvoice._id}`);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleNewPartySave = async (partyData) => {
    try {
      const res = await api.post('/parties', partyData);
      selectParty(res.data.data);
      setShowNewPartyModal(false);
      window.alert('Party created and selected');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to create party');
    }
  };

  if (loading) return <Loading />;

  const isInterState = selectedParty?.stateCode && companyStateCode && selectedParty.stateCode !== companyStateCode;

  const pageTitle = isCreditNote ? 'Create Credit Note' : isPurchaseOrder ? 'Create Purchase Order' : isPurchase ? 'Create Purchase Entry' : 'Create New Invoice';

  return (
    <div className="invoice-create-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">{pageTitle}</h4>
        <div>
          <button className="btn btn-outline-info me-2" onClick={toggleSidebar}>
            <i className={`fas ${sidebarHidden ? 'fa-arrow-right' : 'fa-arrow-left'} me-1`}></i>
            {sidebarHidden ? 'Show Panel' : 'Hide Panel'}
          </button>
          <button className="btn btn-primary me-2" onClick={() => handleSubmit(true)} disabled={saving}>
            <i className="fas fa-save me-1"></i>{saving ? 'Saving...' : 'Save & Print'}
          </button>
          <button className="btn btn-outline-primary me-2" onClick={() => handleSubmit(false)} disabled={saving}>
            <i className="fas fa-save me-1"></i>{saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate('/invoices')}>Cancel</button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-user me-2"></i>Party Details</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold small">Search {(isPurchase || isPurchaseOrder) ? 'Supplier' : isCreditNote ? 'Customer' : 'Party'}</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-search"></i></span>
                  <input
                    ref={partySearchRef}
                    type="text"
                    className="form-control"
                    placeholder={`Search ${(isPurchase || isPurchaseOrder) ? 'supplier' : isCreditNote ? 'customer' : 'party'} by name, mobile or GSTIN...`}
                    value={partySearch}
                    onChange={(e) => handlePartySearch(e.target.value)}
                  />
                  <button className="btn btn-outline-primary" type="button" onClick={() => setShowNewPartyModal(true)}>
                    <i className="fas fa-plus me-1"></i>New
                  </button>
                </div>
                {parties.length > 0 && partySearch.length > 0 && (
                  <div className="party-search-results mt-1 border rounded shadow-sm">
                    {parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase()) || p.mobile.includes(partySearch) || (p.gstin && p.gstin.includes(partySearch))).map(p => (
                      <div key={p._id} className="party-search-item p-2 border-bottom" onClick={() => selectParty(p)} style={{ cursor: 'pointer' }}>
                        <div className="fw-semibold">{p.name} {p.companyName ? `- ${p.companyName}` : ''}</div>
                        <small className="text-muted">{p.mobile} | {p.gstin || 'No GSTIN'} | {p.state || ''}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedParty && (
                <div className="selected-party p-3 bg-light rounded">
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{selectedParty.name}</strong>
                      {selectedParty.companyName && <span className="text-muted ms-2">({selectedParty.companyName})</span>}
                      <p className="mb-0 small text-muted">{selectedParty.address}, {selectedParty.city}, {selectedParty.state} - {selectedParty.pincode}</p>
                      <p className="mb-0 small">GSTIN: {selectedParty.gstin || 'N/A'} | Mobile: {selectedParty.mobile}</p>
                    </div>
                    <button className="btn btn-sm btn-link text-danger" onClick={() => { setSelectedParty(null); setPartySearch(''); }}><i className="fas fa-times"></i></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0"><i className="fas fa-box me-2"></i>Items</h6>
              <button className="btn btn-sm btn-outline-primary" onClick={addItem}><i className="fas fa-plus me-1"></i>Add Item</button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered mb-0 invoice-item-table">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center" style={{ width: '30px' }}>#</th>
                      <th style={{ minWidth: '150px' }}>Product</th>
                      <th>HSN/SAC</th>
                      <th className="text-center" style={{ width: '60px' }}>Qty</th>
                      <th className="text-center" style={{ width: '70px' }}>Unit</th>
                      <th className="text-end" style={{ width: '100px' }}>Rate</th>
                      <th className="text-end" style={{ width: '110px' }}>Taxable Value</th>
                      <th className="text-center" style={{ width: '70px' }}>Tax%</th>
                      {!isInterState && <th className="text-end" style={{ width: '90px' }}>CGST</th>}
                      {!isInterState && <th className="text-end" style={{ width: '90px' }}>SGST</th>}
                      {isInterState && <th className="text-end" style={{ width: '90px' }}>IGST</th>}
                      <th className="text-end" style={{ width: '100px' }}>Total</th>
                      <th className="text-center" style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, index) => (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
                        <td>
                          <div className="position-relative">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Type product name..."
                              value={item.description}
                              onChange={(e) => {
                                handleItemChange(index, 'description', e.target.value);
                                handleProductSearch(e.target.value);
                              }}
                              onFocus={() => { loadProducts(productSearch); setShowProductDropdown(true); }}
                            />
                            {showProductDropdown && (
                              <div className="product-dropdown position-absolute bg-white border rounded shadow-sm w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.hsnCode || '').toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                  <div key={p._id} className="p-2 border-bottom" onClick={() => selectProduct(p, index)} style={{ cursor: 'pointer' }}>
                                    <div className="fw-semibold small">{p.name}</div>
                                    <small className="text-muted">HSN: {p.hsnCode} | ₹{p.sellingPrice} | {p.taxRate}%</small>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <input type="text" className="form-control form-control-sm" value={item.hsnCode} readOnly />
                        </td>
                        <td>
                          <input type="number" className="form-control form-control-sm text-center" value={item.quantity} min={0.001} step={1} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} />
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="number" className="form-control form-control-sm text-end" value={item.rate} min={0} step={0.01} onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))} />
                        </td>
                        <td className="text-end fw-semibold">{formatCurrency(item.taxableValue)}</td>
                        <td>
                          <select className="form-select form-select-sm" value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', Number(e.target.value))}>
                            {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        {!isInterState && <td className="text-end small">{formatCurrency(item.cgst)}</td>}
                        {!isInterState && <td className="text-end small">{formatCurrency(item.sgst)}</td>}
                        {isInterState && <td className="text-end small">{formatCurrency(item.igst)}</td>}
                        <td className="text-end fw-bold">{formatCurrency(item.total)}</td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-link text-danger" onClick={() => removeItem(index)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-cog me-2"></i>Invoice Details</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold small">Invoice Type</label>
                <select className="form-select" value={form.invoiceType} onChange={(e) => setForm({ ...form, invoiceType: e.target.value })}>
                  {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Invoice Date</label>
                <input type="date" className="form-control" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Due Date</label>
                <input type="date" className="form-control" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Place of Supply</label>
                <select className="form-select" value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Payment Status</label>
                <select className="form-select" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-calculator me-2"></i>Summary</h6>
            </div>
            <div className="card-body">
              <div className="summary-row d-flex justify-content-between py-2">
                <span className="text-muted">Subtotal</span>
                <span className="fw-semibold">{formatCurrency(form.subtotal)}</span>
              </div>
              {form.cgstTotal > 0 && (
                <div className="summary-row d-flex justify-content-between py-2">
                  <span className="text-muted">CGST</span>
                  <span>{formatCurrency(form.cgstTotal)}</span>
                </div>
              )}
              {form.sgstTotal > 0 && (
                <div className="summary-row d-flex justify-content-between py-2">
                  <span className="text-muted">SGST</span>
                  <span>{formatCurrency(form.sgstTotal)}</span>
                </div>
              )}
              {form.igstTotal > 0 && (
                <div className="summary-row d-flex justify-content-between py-2">
                  <span className="text-muted">IGST</span>
                  <span>{formatCurrency(form.igstTotal)}</span>
                </div>
              )}
              {form.cessTotal > 0 && (
                <div className="summary-row d-flex justify-content-between py-2">
                  <span className="text-muted">Cess</span>
                  <span>{formatCurrency(form.cessTotal)}</span>
                </div>
              )}
              <div className="summary-row d-flex justify-content-between py-2">
                <span className="text-muted">Round Off</span>
                <span>{formatCurrency(form.roundOff)}</span>
              </div>
              <hr />
              <div className="summary-row d-flex justify-content-between py-2">
                <span className="fw-bold fs-5">Grand Total</span>
                <span className="fw-bold fs-5 text-primary">{formatCurrency(form.grandTotal)}</span>
              </div>
              <div className="mt-2 p-2 bg-light rounded">
                <small className="text-muted">Amount in Words:</small>
                <p className="mb-0 small fw-semibold">{amountInWords(form.grandTotal)}</p>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-truck me-2"></i>Transport</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold small">Transport Mode</label>
                <input type="text" className="form-control" value={form.transportMode} onChange={(e) => setForm({ ...form, transportMode: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Transport Name</label>
                <input type="text" className="form-control" value={form.transportName} onChange={(e) => setForm({ ...form, transportName: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Vehicle No.</label>
                <input type="text" className="form-control" value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">E-Way Bill No.</label>
                <input type="text" className="form-control" value={form.eWayBillNo} onChange={(e) => setForm({ ...form, eWayBillNo: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0"><i className="fas fa-sticky-note me-2"></i>Notes</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold small">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Terms & Conditions</label>
                <textarea className="form-control" rows={2} value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="newPartyModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title fw-bold">Add New Party</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => setShowNewPartyModal(false)}></button>
            </div>
            <div className="modal-body">
              <QuickPartyForm onSave={handleNewPartySave} partyType={defaultPartyType} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickPartyForm = ({ onSave, partyType }) => {
  const [form, setForm] = useState({ partyType: partyType || 'Customer', name: '', companyName: '', gstin: '', mobile: '', email: '', address: '', city: '', state: '', pincode: '', stateCode: 0 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { ...form, [name]: value };
    if (name === 'state') updates.stateCode = getStateCode(value);
    setForm(updates);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) return;
    onSave(form);
    setForm({ partyType: 'Customer', name: '', companyName: '', gstin: '', mobile: '', email: '', address: '', city: '', state: '', pincode: '', stateCode: 0 });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2">
        <div className="d-flex gap-3">
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="partyType" value="Customer" checked={form.partyType === 'Customer'} onChange={handleChange} />
            <label className="form-check-label small">Customer</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="partyType" value="Supplier" checked={form.partyType === 'Supplier'} onChange={handleChange} />
            <label className="form-check-label small">Supplier</label>
          </div>
        </div>
      </div>
      <div className="row g-2">
        <div className="col-6"><input type="text" name="name" className="form-control form-control-sm" placeholder="Name *" value={form.name} onChange={handleChange} /></div>
        <div className="col-6"><input type="text" name="mobile" className="form-control form-control-sm" placeholder="Mobile *" value={form.mobile} onChange={handleChange} /></div>
        <div className="col-6"><input type="text" name="companyName" className="form-control form-control-sm" placeholder="Company" value={form.companyName} onChange={handleChange} /></div>
        <div className="col-6"><input type="text" name="gstin" className="form-control form-control-sm" placeholder="GSTIN" value={form.gstin} onChange={handleChange} /></div>
        <div className="col-12"><input type="text" name="address" className="form-control form-control-sm" placeholder="Address" value={form.address} onChange={handleChange} /></div>
        <div className="col-4"><input type="text" name="city" className="form-control form-control-sm" placeholder="City" value={form.city} onChange={handleChange} /></div>
        <div className="col-4">
          <select className="form-select form-select-sm" name="state" value={form.state} onChange={handleChange}>
            <option value="">State</option>
            {INDIAN_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="col-4"><input type="text" name="pincode" className="form-control form-control-sm" placeholder="Pincode" value={form.pincode} onChange={handleChange} /></div>
      </div>
      <button type="submit" className="btn btn-primary btn-sm w-100 mt-3">Save Party</button>
    </form>
  );
};

export default InvoiceCreate;

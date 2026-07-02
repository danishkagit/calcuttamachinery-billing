import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { UNITS, TAX_RATES } from '../utils/helpers';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', unit: 'Nos', hsnCode: '',
    taxRate: 18, cess: 0, sellingPrice: 0, purchasePrice: 0,
    openingStock: 0, lowStockAlert: 5, gstType: 'gst'
  });

  useEffect(() => {
    if (isEdit) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const p = res.data.data;
      setForm({
        name: p.name || '',
        description: p.description || '',
        unit: p.unit || 'Nos',
        hsnCode: p.hsnCode || '',
        taxRate: p.taxRate || 18,
        cess: p.cess || 0,
        sellingPrice: p.sellingPrice || 0,
        purchasePrice: p.purchasePrice || 0,
        openingStock: p.openingStock || 0,
        lowStockAlert: p.lowStockAlert || 5,
        gstType: p.gstType || 'gst'
      });
    } catch (err) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.hsnCode) {
      toast.error('Name and HSN code are required');
      return;
    }
    if (!form.sellingPrice || form.sellingPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, form);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', form);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="product-form-page page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">{isEdit ? 'Edit Product' : 'Add New Product'}</h4>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Product Name *</label>
                <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Description</label>
                <input type="text" className="form-control" name="description" value={form.description} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Unit</label>
                <select className="form-select" name="unit" value={form.unit} onChange={handleChange}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">HSN Code *</label>
                <input type="text" className="form-control" name="hsnCode" value={form.hsnCode} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Tax Rate *</label>
                <select className="form-select" name="taxRate" value={form.taxRate} onChange={handleChange}>
                  {TAX_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Cess (%)</label>
                <input type="number" className="form-control" name="cess" value={form.cess} onChange={handleChange} min={0} step={0.1} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Selling Price *</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input type="number" className="form-control" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} min={0} step={0.01} />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Purchase Price</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input type="number" className="form-control" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} min={0} step={0.01} />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Opening Stock</label>
                <input type="number" className="form-control" name="openingStock" value={form.openingStock} onChange={handleChange} min={0} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Low Stock Alert</label>
                <input type="number" className="form-control" name="lowStockAlert" value={form.lowStockAlert} onChange={handleChange} min={0} />
              </div>
            </div>

            <div className="text-end">
              <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/products')}>Cancel</button>
              <button type="submit" className="btn btn-primary px-5" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : isEdit ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;

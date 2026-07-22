import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Loading from '../components/Loading';

const SIZE_MAP = { small: '160px', medium: '240px', large: '320px' };

const BarcodeGenerator = () => {
  const [activeTab, setActiveTab] = useState('product');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customText, setCustomText] = useState('');
  const [barcodeType, setBarcodeType] = useState('code128');
  const [barcodeData, setBarcodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [barcodeSize, setBarcodeSize] = useState('medium');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products', { params: { limit: 500 } });
        setProducts(res.data.data || []);
      } catch (err) {
        window.alert('Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const generateProductBarcode = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setBarcodeData(null);
    try {
      const res = await api.get(`/barcode/${selectedProduct}`);
      setBarcodeData(res.data.data);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to generate barcode');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomBarcode = async () => {
    if (!customText.trim()) return;
    setLoading(true);
    setBarcodeData(null);
    try {
      const res = await api.post('/barcode/custom', { text: customText.trim(), type: barcodeType });
      setBarcodeData(res.data.data);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to generate barcode');
    } finally {
      setLoading(false);
    }
  };

  const downloadBarcode = () => {
    if (!barcodeData?.barcode) return;
    const link = document.createElement('a');
    link.download = `barcode-${Date.now()}.png`;
    link.href = barcodeData.barcode;
    link.click();
  };

  const printBarcode = () => {
    if (!barcodeData?.barcode) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;height:auto}</style></head><body><img src="${barcodeData.barcode}" /></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><i className="fas fa-qrcode me-2"></i>Barcode Generator</h4>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'product' ? 'active' : ''}`} onClick={() => { setActiveTab('product'); setBarcodeData(null); }}>
            <i className="fas fa-box me-1"></i> Product Barcode
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => { setActiveTab('custom'); setBarcodeData(null); }}>
            <i className="fas fa-edit me-1"></i> Custom Barcode
          </button>
        </li>
      </ul>

      <div className="row">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {activeTab === 'product' && (
                <>
                  <h6 className="fw-bold mb-3">Select Product</h6>
                  {productsLoading ? <Loading /> : (
                    <div className="mb-3">
                      <select className="form-select" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                        <option value="">-- Select a product --</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name} {p.hsnCode ? `(${p.hsnCode})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectedProduct && products.length > 0 && (
                    <div className="small text-muted mb-3">
                      {(() => {
                        const p = products.find(x => x._id === selectedProduct);
                        return p ? <>{p.name} | HSN: {p.hsnCode || '-'} | Price: ₹{p.sellingPrice || 0}</> : null;
                      })()}
                    </div>
                  )}
                  <button className="btn btn-primary w-100" disabled={!selectedProduct || loading} onClick={generateProductBarcode}>
                    {loading ? 'Generating...' : <><i className="fas fa-qrcode me-1"></i> Generate Barcode</>}
                  </button>
                </>
              )}

              {activeTab === 'custom' && (
                <>
                  <h6 className="fw-bold mb-3">Custom Barcode</h6>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Text to Encode</label>
                    <input type="text" className="form-control" value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Enter text for barcode..." maxLength={500} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Barcode Type</label>
                    <select className="form-select" value={barcodeType} onChange={(e) => setBarcodeType(e.target.value)}>
                      <option value="code128">Code 128</option>
                      <option value="qrcode">QR Code</option>
                      <option value="ean13">EAN-13</option>
                    </select>
                  </div>
                  <button className="btn btn-primary w-100" disabled={!customText.trim() || loading} onClick={generateCustomBarcode}>
                    {loading ? 'Generating...' : <><i className="fas fa-qrcode me-1"></i> Generate</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="fw-bold mb-3">Preview</h6>
              {loading && <Loading />}
              {!loading && !barcodeData && (
                <div className="py-5 text-muted">
                  <i className="fas fa-qrcode" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <p className="mt-2">Select a product or enter custom text to generate a barcode</p>
                </div>
              )}
              {!loading && barcodeData && (
                <>
                  <div className="barcode-display p-4 mb-3">
                    <img src={barcodeData.barcode} alt="Barcode" className="barcode-image" style={{ width: SIZE_MAP[barcodeSize], maxWidth: '100%' }} />
                    <div className="barcode-text-below mt-2 text-muted small">{barcodeData.text}</div>
                  </div>
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    <div className="btn-group btn-group-sm">
                      <button className={`btn ${barcodeSize === 'small' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setBarcodeSize('small')}>Small</button>
                      <button className={`btn ${barcodeSize === 'medium' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setBarcodeSize('medium')}>Medium</button>
                      <button className={`btn ${barcodeSize === 'large' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setBarcodeSize('large')}>Large</button>
                    </div>
                  </div>
                  <div className="d-flex justify-content-center gap-2">
                    <button className="btn btn-outline-success" onClick={downloadBarcode}><i className="fas fa-download me-1"></i>Download PNG</button>
                    <button className="btn btn-outline-info" onClick={printBarcode}><i className="fas fa-print me-1"></i>Print</button>
                    <button className="btn btn-outline-warning" onClick={() => { navigator.clipboard.writeText(barcodeData.barcode); window.alert('Image URL copied!'); }}>
                      <i className="fas fa-copy me-1"></i>Copy Image
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;

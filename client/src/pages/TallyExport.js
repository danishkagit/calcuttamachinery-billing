import React, { useState } from 'react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import Loading from '../components/Loading';

const TallyExport = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dataType, setDataType] = useState('all');
  const [xmlContent, setXmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileSize, setFileSize] = useState('');

  const sanitizeXml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const generateTaxLedgerXml = (name, parent, gstRate) => {
    return `    <TALLYMESSAGE xmlns="TallyXMLSchema">
      <LEDGER Action="Create">
        <NAME>${sanitizeXml(name)}</NAME>
        <PARENT>${sanitizeXml(parent)}</PARENT>
        <GSTDETAILS.LIST>
          <APPLICABLEFROM>01042017</APPLICABLEFROM>
          <TAXABILITY>Taxable</TAXABILITY>
          <RATEDETAILS.LIST>
            <APPLICABLEFROM>01042017</APPLICABLEFROM>
            <TAXRATE>${gstRate}</TAXRATE>
          </RATEDETAILS.LIST>
        </GSTDETAILS.LIST>
      </LEDGER>
    </TALLYMESSAGE>`;
  };

  const generatePartyXml = (party) => {
    const state = party.state || '';
    const stateCode = party.stateCode || '';
    return `    <TALLYMESSAGE xmlns="TallyXMLSchema">
      <LEDGER Action="Create">
        <NAME>${sanitizeXml(party.name)}</NAME>
        <PARENT>${party.partyType === 'Supplier' ? 'Sundry Creditors' : 'Sundry Debtors'}</PARENT>
        <ADDRESS>${sanitizeXml(party.address || '')}</ADDRESS>
        <COUNTRY>India</COUNTRY>
        <STATE>${sanitizeXml(state)}</STATE>
        <PINCODE>${sanitizeXml(party.pincode || '')}</PINCODE>
        <GSTIN>${sanitizeXml(party.gstin || '')}</GSTIN>
        <PARTYGSTDETAILS.LIST>
          <STATENAME>${sanitizeXml(state)}</STATENAME>
          <GSTREGISTRATIONTYPE>${party.gstin ? 'Regular' : 'Unregistered'}</GSTREGISTRATIONTYPE>
        </PARTYGSTDETAILS.LIST>
      </LEDGER>
    </TALLYMESSAGE>`;
  };

  const generateInvoiceXml = (inv) => {
    const dateStr = inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10).replace(/-/g, '') : '';
    const partyName = inv.party?.name || '';
    const items = inv.items || [];
    const gstTotal = (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0);

    let itemEntries = items.map(item => {
      const hsn = item.product?.hsnCode || item.hsnCode || '';
      const desc = sanitizeXml(item.description || item.product?.name || '');
      return `          <ALLINVENTORYENTRIES.LIST>
            <INVENTORYENTRY>
              <PRODUCTALIAS>${desc}</PRODUCTALIAS>
              <PRODUCTNAME>${desc}</PRODUCTNAME>
              <RATE>${item.rate || 0}</RATE>
              <QUANTITY>${item.quantity || 1}</QUANTITY>
              <ACTUALQTY>${item.quantity || 1}</ACTUALQTY>
              <AMOUNT>${item.taxableValue || 0}</AMOUNT>
              <HSNCODE>${sanitizeXml(hsn)}</HSNCODE>
              <GSTTAXRATE>${item.taxRate || 0}</GSTTAXRATE>
            </INVENTORYENTRY>
          </ALLINVENTORYENTRIES.LIST>`;
    }).join('\n');

    return `    <TALLYMESSAGE xmlns="TallyXMLSchema">
      <VOUCHER Action="Create" VOUCHERNAME="Sales Invoice">
        <DATE>${dateStr}</DATE>
        <VOUCHERTYPENAME>Sales Invoice</VOUCHERTYPENAME>
        <PARTYLEDGERNAME>${sanitizeXml(partyName)}</PARTYLEDGERNAME>
        <VOUCHERNUMBER>${sanitizeXml(inv.invoiceNo || '')}</VOUCHERNUMBER>
        <GSTINVOICE>Yes</GSTINVOICE>
        <PARTYGSTIN>${sanitizeXml(inv.party?.gstin || '')}</PARTYGSTIN>
        <TAXABLEAMOUNT>${inv.subtotal || 0}</TAXABLEAMOUNT>
        <GSTAMOUNT>${gstTotal}</GSTAMOUNT>
        <BILLAMOUNT>${inv.grandTotal || 0}</BILLAMOUNT>
        <PLACEOFSUPPLY>${sanitizeXml(inv.placeOfSupply || '')}</PLACEOFSUPPLY>
${itemEntries}
      </VOUCHER>
    </TALLYMESSAGE>`;
  };

  const generateXml = async () => {
    setLoading(true);
    setXmlContent('');
    setFileSize('');
    try {
      let parts = [];

      if (dataType === 'all' || dataType === 'parties') {
        const partyRes = await api.get('/parties', { params: { limit: 5000 } });
        const parties = partyRes.data.data || [];
        parties.forEach(p => parts.push(generatePartyXml(p)));
      }

      if (dataType === 'all' || dataType === 'products') {
        const prodRes = await api.get('/products', { params: { limit: 5000 } });
        const products = prodRes.data.data || [];
        products.forEach(p => {
          parts.push(`    <TALLYMESSAGE xmlns="TallyXMLSchema">
      <STOCKITEM Action="Create">
        <NAME>${sanitizeXml(p.name)}</NAME>
        <HSNCODE>${sanitizeXml(p.hsnCode || '')}</HSNCODE>
        <TAXRATE>${p.taxRate || 0}</TAXRATE>
        <UNITS>${sanitizeXml(p.unit || 'Nos')}</UNITS>
        <RATEOFINVOICE>${p.sellingPrice || 0}</RATEOFINVOICE>
        <OPENINGSTOCK>${p.openingStock || 0}</OPENINGSTOCK>
      </STOCKITEM>
    </TALLYMESSAGE>`);
        });
      }

      if (dataType === 'all' || dataType === 'invoices') {
        const params = { limit: 5000 };
        if (fromDate) params.startDate = fromDate;
        if (toDate) params.endDate = toDate;
        const invRes = await api.get('/invoices', { params });
        const invoices = invRes.data.data || [];
        invoices.forEach(inv => parts.push(generateInvoiceXml(inv)));
      }

      const header = `<?xml version="1.0" encoding="utf-8"?>\n<envelop version="1.0">\n`;
      const footer = `</envelop>`;
      const fullXml = header + parts.join('\n') + '\n' + footer;

      setXmlContent(fullXml);
      const bytes = new Blob([fullXml]).size;
      setFileSize(bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to generate XML');
    } finally {
      setLoading(false);
    }
  };

  const downloadXml = () => {
    if (!xmlContent) return;
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tally_export_${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(xmlContent).then(() => {
      window.alert('XML copied to clipboard!');
    }).catch(() => {
      window.alert('Failed to copy');
    });
  };

  return (
    <div className="page-enter">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0"><i className="fas fa-file-export me-2"></i>Tally Export</h4>
        <span className="text-muted small">Export your data in Tally-compatible XML format</span>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Export Options</h6>
              <div className="mb-3">
                <label className="form-label small fw-semibold">From Date</label>
                <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">To Date</label>
                <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Data Type</label>
                <select className="form-select" value={dataType} onChange={(e) => setDataType(e.target.value)}>
                  <option value="all">All Data</option>
                  <option value="invoices">Invoices Only</option>
                  <option value="parties">Parties Only</option>
                  <option value="products">Products Only</option>
                </select>
              </div>
              <button className="btn btn-primary w-100" disabled={loading} onClick={generateXml}>
                {loading ? 'Generating...' : <><i className="fas fa-file-code me-1"></i> Generate Tally XML</>}
              </button>
            </div>
          </div>
          {fileSize && (
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body text-center">
                <div className="small text-muted">File Size</div>
                <div className="fw-bold">{fileSize}</div>
              </div>
            </div>
          )}
        </div>

        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <span className="fw-semibold">XML Preview</span>
              {xmlContent && (
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-success" onClick={downloadXml}><i className="fas fa-download me-1"></i>Download</button>
                  <button className="btn btn-sm btn-outline-primary" onClick={copyToClipboard}><i className="fas fa-copy me-1"></i>Copy</button>
                </div>
              )}
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="py-5"><Loading /></div>
              ) : !xmlContent ? (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-file-code" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                  <p className="mt-2">Configure options and click "Generate Tally XML"</p>
                </div>
              ) : (
                <textarea className="tally-xml-preview" readOnly value={xmlContent} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyExport;

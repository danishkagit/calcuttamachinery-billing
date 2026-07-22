const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Party = require('../models/Party');
const FilingHistory = require('../models/FilingHistory');
const { protect } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

const GST_API_BASE = 'https://services.gst.gov.in/services/api';

function getPeriodDates(year, month) {
  const m = String(month).padStart(2, '0');
  const startDate = `${year}-${m}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate, fp: `${m}${year}` };
}

async function getInvoicesForPeriod(year, month) {
  const { startDate, endDate } = getPeriodDates(year, month);
  return Invoice.find({
    invoiceDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
  })
    .populate('party', 'name gstin stateCode')
    .populate('items.product', 'hsnCode name unit')
    .lean();
}

// GET /api/gst/gstr1/:year/:month - Generate GSTR-1 JSON
router.get('/gstr1/:year/:month', protect, async (req, res) => {
  try {
    const { year, month } = req.params;
    const invoices = await getInvoicesForPeriod(Number(year), Number(month));
    const { fp } = getPeriodDates(Number(year), Number(month));

    const b2b = [];
    const b2cs = [];
    const cdnr = [];
    const hsnData = {};
    let totalValue = 0;

    invoices.forEach(inv => {
      const invVal = inv.grandTotal || 0;
      totalValue += invVal;
      const partyGstin = inv.party?.gstin;
      const isRegistered = partyGstin && partyGstin.length === 15;
      const isCnDn = inv.invoiceType === 'Credit Note' || inv.invoiceType === 'Debit Note';

      const items = (inv.items || []).map(item => ({
        hsn_sc: item.product?.hsnCode || item.hsnCode || '',
        desc: item.description || item.product?.name || '',
        uqc: item.unit || 'Nos',
        qty: item.quantity || 0,
        rt: item.taxRate || 0,
        txval: Math.round((item.taxableValue || 0) * 100) / 100,
        iamt: Math.round((item.igst || 0) * 100) / 100,
        camt: Math.round((item.cgst || 0) * 100) / 100,
        samt: Math.round((item.sgst || 0) * 100) / 100,
        csamt: Math.round((item.cess || 0) * 100) / 100,
        total: Math.round((item.total || 0) * 100) / 100
      }));

      if (isRegistered && !isCnDn) {
        b2b.push({
          ctin: partyGstin,
          inv: [{
            inum: inv.invoiceNo,
            idt: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
            itms: items.map((item, idx) => ({ num: idx + 1, itm_det: item })),
            val: Math.round(invVal * 100) / 100,
            pos: inv.placeOfSupply || inv.party?.stateCode || '',
            rchrg: 'N',
            inv_typ: inv.invoiceType === 'Bill of Supply' ? 'BOS' : 'R',
            chksum: ''
          }]
        });
      } else if (!isRegistered && !isCnDn) {
        const rateGroups = {};
        items.forEach(item => {
          const key = item.rt;
          if (!rateGroups[key]) rateGroups[key] = { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
          rateGroups[key].txval += item.txval;
          rateGroups[key].iamt += item.iamt;
          rateGroups[key].camt += item.camt;
          rateGroups[key].samt += item.samt;
          rateGroups[key].csamt += item.csamt;
        });
        Object.entries(rateGroups).forEach(([rt, vals]) => {
          b2cs.push({
            rt: Number(rt),
            txval: Math.round(vals.txval * 100) / 100,
            iamt: Math.round(vals.iamt * 100) / 100,
            camt: Math.round(vals.camt * 100) / 100,
            samt: Math.round(vals.samt * 100) / 100,
            csamt: Math.round(vals.csamt * 100) / 100
          });
        });
      } else if (isCnDn) {
        const section = isRegistered ? cdnr : [];
        if (isRegistered) {
          cdnr.push({
            ctin: partyGstin,
            nt: [{
              nt_num: inv.invoiceNo,
              nt_dt: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
              ntty: inv.invoiceType === 'Credit Note' ? 'C' : 'D',
              itms: items.map((item, idx) => ({ num: idx + 1, itm_det: item })),
              val: Math.round(invVal * 100) / 100,
              pos: inv.placeOfSupply || inv.party?.stateCode || ''
            }]
          });
        }
      }

      (inv.items || []).forEach(item => {
        const hsn = item.product?.hsnCode || item.hsnCode || 'OTHER';
        if (!hsnData[hsn]) {
          hsnData[hsn] = { hsn_sc: hsn, desc: item.description || item.product?.name || '', uqc: item.unit || 'Nos', qty: 0, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
        }
        hsnData[hsn].qty += item.quantity || 0;
        hsnData[hsn].txval += item.taxableValue || 0;
        hsnData[hsn].iamt += item.igst || 0;
        hsnData[hsn].camt += item.cgst || 0;
        hsnData[hsn].samt += item.sgst || 0;
        hsnData[hsn].csamt += item.cess || 0;
      });
    });

    Object.keys(hsnData).forEach(k => {
      ['qty', 'txval', 'iamt', 'camt', 'samt', 'csamt'].forEach(f => {
        hsnData[k][f] = Math.round(hsnData[k][f] * 100) / 100;
      });
    });

    res.json({
      success: true,
      data: {
        fp,
        gt: Math.round(totalValue * 100) / 100,
        cur_gt: Math.round(totalValue * 100) / 100,
        b2b,
        b2cs,
        cdnr,
        hsn: Object.values(hsnData),
        summary: {
          totalInvoices: invoices.length,
          b2bCount: b2b.length,
          b2csCount: b2cs.reduce((s, g) => s + 1, 0),
          cdnrCount: cdnr.length,
          totalValue: Math.round(totalValue * 100) / 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/gst/gstr3b/:year/:month - Generate GSTR-3B JSON
router.get('/gstr3b/:year/:month', protect, async (req, res) => {
  try {
    const { year, month } = req.params;
    const invoices = await getInvoicesForPeriod(Number(year), Number(month));
    const parties = await Party.find({}).lean();
    const { fp } = getPeriodDates(Number(year), Number(month));

    const supplierIds = parties.filter(p => p.partyType === 'Supplier').map(p => p._id.toString());

    const supDetails = {
      osup_det: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
      osup_zero: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
      osup_nil_exmp: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
      isup_rev: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 },
      osup_det_os: { txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 }
    };

    const itcDetails = {
      itc_avl: [
        { ty: 'IMPG', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'IMPS', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'ISRC', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'ISD', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'OTH', iamt: 0, camt: 0, samt: 0, csamt: 0 }
      ]
    };

    const totalTxval = { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };

    invoices.forEach(inv => {
      const isCreditNote = inv.invoiceType === 'Credit Note';
      const isDebitNote = inv.invoiceType === 'Debit Note';
      const isPurchase = supplierIds.includes(inv.party?._id?.toString() || '');
      const isInterState = inv.igstTotal > 0;
      const taxable = inv.subtotal || 0;
      const igst = inv.igstTotal || 0;
      const cgst = inv.cgstTotal || 0;
      const sgst = inv.sgstTotal || 0;
      const cess = inv.cessTotal || 0;

      if (isPurchase) {
        supDetails.isup_rev.txval += taxable;
        supDetails.isup_rev.iamt += igst;
        supDetails.isup_rev.camt += cgst;
        supDetails.isup_rev.samt += sgst;
        supDetails.isup_rev.csamt += cess;

        itcDetails.itc_avl.find(t => t.ty === 'OTH').iamt += igst;
        itcDetails.itc_avl.find(t => t.ty === 'OTH').camt += cgst;
        itcDetails.itc_avl.find(t => t.ty === 'OTH').samt += sgst;
        itcDetails.itc_avl.find(t => t.ty === 'OTH').csamt += cess;
      } else if (!isCreditNote && !isDebitNote) {
        if (isInterState) {
          supDetails.osup_zero.txval += taxable;
          supDetails.osup_zero.iamt += igst;
          supDetails.osup_zero.camt += cgst;
          supDetails.osup_zero.samt += sgst;
          supDetails.osup_zero.csamt += cess;
        } else {
          supDetails.osup_det.txval += taxable;
          supDetails.osup_det.iamt += igst;
          supDetails.osup_det.camt += cgst;
          supDetails.osup_det.samt += sgst;
          supDetails.osup_det.csamt += cess;
        }
      }

      totalTxval.taxable += taxable;
      totalTxval.igst += igst;
      totalTxval.cgst += cgst;
      totalTxval.sgst += sgst;
      totalTxval.cess += cess;
    });

    ['osup_det', 'osup_zero', 'osup_nil_exmp', 'isup_rev', 'osup_det_os'].forEach(k => {
      ['txval', 'iamt', 'camt', 'samt', 'csamt'].forEach(f => {
        supDetails[k][f] = Math.round(supDetails[k][f] * 100) / 100;
      });
    });
    itcDetails.itc_avl.forEach(t => {
      ['iamt', 'camt', 'samt', 'csamt'].forEach(f => {
        t[f] = Math.round(t[f] * 100) / 100;
      });
    });
    ['taxable', 'igst', 'cgst', 'sgst', 'cess'].forEach(f => {
      totalTxval[f] = Math.round(totalTxval[f] * 100) / 100;
    });

    res.json({
      success: true,
      data: {
        fp,
        gstin: '',
        sup_details: supDetails,
        itc_elg: itcDetails,
        inter_sup: { unicom: [] },
        tx_pay: { tx_py: [] },
        intr_ltfee: { intr_details: { iamt: 0, camt: 0, samt: 0, csamt: 0 }, ltfee_details: { camt: 0, samt: 0 } },
        totalInvoices: invoices.length,
        totalTxval
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/gst/auth/request-otp
router.post('/auth/request-otp', protect, async (req, res) => {
  try {
    const { username, gstin } = req.body;
    if (!username || !gstin) {
      return res.status(400).json({ success: false, error: 'Username and GSTIN are required' });
    }
    const response = await axios.post(`${GST_API_BASE}/login/requestotp`, {
      username,
      gstin,
      action: 'GSTR'
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ success: false, error: error.response.data?.message || 'OTP request failed' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/gst/auth/authenticate
router.post('/auth/authenticate', protect, async (req, res) => {
  try {
    const { username, password, gstin } = req.body;
    if (!username || !password || !gstin) {
      return res.status(400).json({ success: false, error: 'Username, password, and GSTIN are required' });
    }
    const response = await axios.post(`${GST_API_BASE}/login/authenticate`, {
      username,
      password: Buffer.from(password).toString('base64'),
      gstin
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ success: false, error: error.response.data?.message || 'Authentication failed' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/gst/gstr1/file - File GSTR-1 via GST portal
router.post('/gstr1/file', protect, async (req, res) => {
  try {
    const { token, gstin, fp, returnData, action } = req.body;
    if (!token || !gstin || !fp || !returnData) {
      return res.status(400).json({ success: false, error: 'Token, GSTIN, period, and return data are required' });
    }
    const endpoint = action === 'save' ? 'save' : action === 'submit' ? 'submit' : 'file';
    const response = await axios.post(
      `${GST_API_BASE}/gstr1/${endpoint}`,
      { gstin, fp, ...returnData },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': 'gst-api-key'
        }
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ success: false, error: error.response.data?.message || 'GSTR-1 filing failed' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/gst/gstr3b/file - File GSTR-3B via GST portal
router.post('/gstr3b/file', protect, async (req, res) => {
  try {
    const { token, gstin, fp, returnData, action } = req.body;
    if (!token || !gstin || !fp || !returnData) {
      return res.status(400).json({ success: false, error: 'Token, GSTIN, period, and return data are required' });
    }
    const endpoint = action === 'save' ? 'save' : action === 'submit' ? 'submit' : 'file';
    const response = await axios.post(
      `${GST_API_BASE}/gstr3b/${endpoint}`,
      { gstin, fp, ...returnData },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': 'gst-api-key'
        }
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ success: false, error: error.response.data?.message || 'GSTR-3B filing failed' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GST Filing History — persisted to MongoDB
// ---------------------------------------------------------------------------

/**
 * GET /api/gst/filing-history
 *
 * Returns filing history records for the authenticated user.
 * Query params:
 *   returnType {string}  – GSTR-1 | GSTR-3B
 *   status     {string}  – filed | saved | submitted
 *   page       {number}  – default 1
 *   limit      {number}  – default 20, max 100
 */
router.get('/filing-history', protect, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (req.query.returnType && ['GSTR-1', 'GSTR-3B'].includes(req.query.returnType)) {
      filter.returnType = req.query.returnType;
    }

    if (req.query.status && ['filed', 'saved', 'submitted'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [records, total] = await Promise.all([
      FilingHistory.find(filter)
        .sort({ filedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('companyId', 'businessName gstin')
        .lean(),
      FilingHistory.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: records,
      count: records.length,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/gst/filing-history
 *
 * Body:
 *   returnType      {string, required} – GSTR-1 | GSTR-3B
 *   period          {string, required} – YYYY-MM, e.g. "2024-03"
 *   status          {string}           – filed | saved | submitted (default: filed)
 *   acknowledgmentNo {string}          – portal acknowledgment number
 *   companyId       {string}           – Company ObjectId
 */
router.post(
  '/filing-history',
  protect,
  [
    body('returnType')
      .isIn(['GSTR-1', 'GSTR-3B'])
      .withMessage('returnType must be GSTR-1 or GSTR-3B'),
    body('period')
      .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
      .withMessage('period must be in YYYY-MM format (e.g. 2024-03)'),
    body('status')
      .optional()
      .isIn(['filed', 'saved', 'submitted'])
      .withMessage('status must be filed, saved, or submitted'),
    body('acknowledgmentNo').optional().isString().trim(),
    body('companyId').optional().isString().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { returnType, period, status, acknowledgmentNo, companyId } = req.body;

      const record = await FilingHistory.create({
        userId:          req.user._id,
        returnType,
        period,
        status:          status || 'filed',
        filedAt:         new Date(),
        acknowledgmentNo: acknowledgmentNo || '',
        companyId:       companyId || null
      });

      const populated = await FilingHistory.findById(record._id)
        .populate('companyId', 'businessName gstin')
        .lean();

      res.status(201).json({ success: true, data: populated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;

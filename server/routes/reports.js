const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Party = require('../models/Party');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

const getDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate && endDate) {
    filter.invoiceDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.invoiceDate = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.invoiceDate = { $lte: new Date(endDate) };
  }
  return filter;
};

router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, monthlySales, totalParties, totalProducts, outstandingInvoices, recentInvoices, todayPayments] = await Promise.all([
      Invoice.aggregate([
        { $match: { invoiceDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Invoice.aggregate([
        { $match: { invoiceDate: { $gte: startOfMonth, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Party.countDocuments({}),
      Product.countDocuments({}),
      Invoice.find({ paymentStatus: { $ne: 'Paid' } })
        .select('grandTotal paidAmount')
        .lean(),
      Invoice.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('party', 'name companyName')
        .populate('company', 'businessName')
        .lean(),
      Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: today, $lt: tomorrow }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => {
      const due = inv.grandTotal - (inv.paidAmount || 0);
      return sum + (due > 0 ? due : 0);
    }, 0);

    res.json({
      success: true,
      data: {
        todaySales: todaySales.length > 0 ? todaySales[0].total : 0,
        monthlySales: monthlySales.length > 0 ? monthlySales[0].total : 0,
        totalParties,
        totalProducts,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        recentInvoices,
        todayPayments: todayPayments.length > 0 ? todayPayments[0].total : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sales', protect, async (req, res) => {
  try {
    const filter = { invoiceType: { $ne: 'Credit Note' } };
    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
    Object.assign(filter, dateFilter);

    if (req.query.party) {
      filter.party = req.query.party;
    }

    const invoices = await Invoice.find(filter)
      .populate('party', 'name companyName gstin stateCode')
      .populate('company', 'businessName gstin stateCode')
      .sort({ invoiceDate: -1 });

    const summary = invoices.reduce((acc, inv) => {
      acc.totalTaxable += inv.subtotal || 0;
      acc.totalCGST += inv.cgstTotal || 0;
      acc.totalSGST += inv.sgstTotal || 0;
      acc.totalIGST += inv.igstTotal || 0;
      acc.totalCess += inv.cessTotal || 0;
      acc.totalAmount += inv.grandTotal || 0;
      return acc;
    }, { totalTaxable: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0, totalCess: 0, totalAmount: 0 });

    res.json({
      success: true,
      data: {
        invoices,
        summary: {
          totalTaxable: Math.round(summary.totalTaxable * 100) / 100,
          totalCGST: Math.round(summary.totalCGST * 100) / 100,
          totalSGST: Math.round(summary.totalSGST * 100) / 100,
          totalIGST: Math.round(summary.totalIGST * 100) / 100,
          totalCess: Math.round(summary.totalCess * 100) / 100,
          totalAmount: Math.round(summary.totalAmount * 100) / 100,
          invoiceCount: invoices.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/purchases', protect, async (req, res) => {
  try {
    const filter = {};
    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
    Object.assign(filter, dateFilter);

    const parties = await Party.find({ partyType: 'Supplier' }).select('_id');
    const supplierIds = parties.map(p => p._id);
    filter.party = { $in: supplierIds };

    if (req.query.party) {
      filter.party = req.query.party;
    }

    const invoices = await Invoice.find(filter)
      .populate('party', 'name companyName gstin')
      .populate('company', 'businessName gstin')
      .sort({ invoiceDate: -1 });

    const summary = invoices.reduce((acc, inv) => {
      acc.totalTaxable += inv.subtotal || 0;
      acc.totalTax += (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0) + (inv.cessTotal || 0);
      acc.totalAmount += inv.grandTotal || 0;
      return acc;
    }, { totalTaxable: 0, totalTax: 0, totalAmount: 0 });

    res.json({
      success: true,
      data: {
        invoices,
        summary: {
          totalTaxable: Math.round(summary.totalTaxable * 100) / 100,
          totalTax: Math.round(summary.totalTax * 100) / 100,
          totalAmount: Math.round(summary.totalAmount * 100) / 100,
          invoiceCount: invoices.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/gstr1', protect, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
    const filter = { ...dateFilter };

    const invoices = await Invoice.find(filter)
      .populate('party', 'name companyName gstin stateCode')
      .populate('company', 'businessName gstin stateCode')
      .populate('items.product', 'hsnCode name unit')
      .lean();

    const b2b = [];
    const b2cs = [];
    const hsnSummary = {};
    let totalTaxableB2b = 0;
    let totalTaxB2b = 0;
    let totalTaxableB2cs = 0;
    let totalTaxB2cs = 0;

    invoices.forEach(inv => {
      const partyGstin = inv.party && inv.party.gstin;
      const isRegistered = partyGstin && partyGstin.length === 15;

      if (isRegistered) {
        b2b.push({
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          partyName: inv.party ? inv.party.name : '',
          partyGstin: inv.party.gstin,
          taxableValue: inv.subtotal || 0,
          cgst: inv.cgstTotal || 0,
          sgst: inv.sgstTotal || 0,
          igst: inv.igstTotal || 0,
          cess: inv.cessTotal || 0,
          grandTotal: inv.grandTotal || 0,
          invoiceType: inv.invoiceType
        });
        totalTaxableB2b += inv.subtotal || 0;
        totalTaxB2b += (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0) + (inv.cessTotal || 0);
      } else {
        b2cs.push({
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          partyName: inv.party ? inv.party.name : '',
          taxableValue: inv.subtotal || 0,
          grandTotal: inv.grandTotal || 0
        });
        totalTaxableB2cs += inv.subtotal || 0;
        totalTaxB2cs += (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0) + (inv.cessTotal || 0);
      }

      if (inv.items && inv.items.length > 0) {
        inv.items.forEach(item => {
          if (item.product) {
            const hsn = item.product.hsnCode || 'NA';
            if (!hsnSummary[hsn]) {
              hsnSummary[hsn] = {
                hsnCode: hsn,
                description: item.product.name || '',
                uqc: item.unit || 'Nos',
                totalQuantity: 0,
                totalValue: 0,
                totalTaxable: 0,
                totalIGST: 0,
                totalCGST: 0,
                totalSGST: 0,
                totalCess: 0
              };
            }
            hsnSummary[hsn].totalQuantity += item.quantity || 0;
            hsnSummary[hsn].totalValue += (item.quantity || 0) * (item.rate || 0);
            hsnSummary[hsn].totalTaxable += item.taxableValue || 0;
            hsnSummary[hsn].totalIGST += item.igst || 0;
            hsnSummary[hsn].totalCGST += item.cgst || 0;
            hsnSummary[hsn].totalSGST += item.sgst || 0;
            hsnSummary[hsn].totalCess += item.cess || 0;
          }
        });
      }
    });

    Object.keys(hsnSummary).forEach(key => {
      const h = hsnSummary[key];
      h.totalQuantity = Math.round(h.totalQuantity * 100) / 100;
      h.totalValue = Math.round(h.totalValue * 100) / 100;
      h.totalTaxable = Math.round(h.totalTaxable * 100) / 100;
      h.totalIGST = Math.round(h.totalIGST * 100) / 100;
      h.totalCGST = Math.round(h.totalCGST * 100) / 100;
      h.totalSGST = Math.round(h.totalSGST * 100) / 100;
      h.totalCess = Math.round(h.totalCess * 100) / 100;
    });

    res.json({
      success: true,
      data: {
        b2b: {
          invoices: b2b,
          summary: {
            totalInvoices: b2b.length,
            totalTaxable: Math.round(totalTaxableB2b * 100) / 100,
            totalTax: Math.round(totalTaxB2b * 100) / 100
          }
        },
        b2cs: {
          invoices: b2cs,
          summary: {
            totalInvoices: b2cs.length,
            totalTaxable: Math.round(totalTaxableB2cs * 100) / 100,
            totalTax: Math.round(totalTaxB2cs * 100) / 100
          }
        },
        hsnSummary: Object.values(hsnSummary)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/gstr3b', protect, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query.startDate, req.query.endDate);
    const filter = { ...dateFilter };

    const invoices = await Invoice.find(filter)
      .populate('party', 'gstin stateCode')
      .lean();

    let outwardTaxable = 0;
    let outwardZeroRated = 0;
    let inwardSupplies = 0;
    let itcClaimed = 0;

    const parties = await Party.find({}).lean();
    const supplierIds = parties.filter(p => p.partyType === 'Supplier').map(p => p._id.toString());

    invoices.forEach(inv => {
      if (inv.invoiceType !== 'Credit Note' && inv.invoiceType !== 'Debit Note') {
        outwardTaxable += inv.subtotal || 0;
      }

      if (inv.igstTotal > 0 && inv.invoiceType !== 'Credit Note') {
        outwardZeroRated += inv.subtotal || 0;
      }

      if (supplierIds.includes(inv.party ? inv.party._id.toString() : '')) {
        inwardSupplies += inv.subtotal || 0;
        itcClaimed += (inv.cgstTotal || 0) + (inv.sgstTotal || 0) + (inv.igstTotal || 0) + (inv.cessTotal || 0);
      }
    });

    res.json({
      success: true,
      data: {
        '3.1(a)': {
          label: 'Outward taxable supplies (other than zero rated, nil rated and exempted)',
          taxableValue: Math.round(outwardTaxable * 100) / 100,
          tax: 0
        },
        '3.1(b)': {
          label: 'Outward taxable supplies (zero rated)',
          taxableValue: Math.round(outwardZeroRated * 100) / 100,
          tax: 0
        },
        '4': {
          label: 'ITC claimed',
          taxableValue: Math.round(inwardSupplies * 100) / 100,
          tax: Math.round(itcClaimed * 100) / 100
        },
        '5.1': {
          label: 'Inward supplies',
          taxableValue: Math.round(inwardSupplies * 100) / 100,
          tax: Math.round(itcClaimed * 100) / 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/party-outstanding', protect, async (req, res) => {
  try {
    const invoices = await Invoice.find({
      paymentStatus: { $ne: 'Paid' }
    })
      .populate('party', 'name companyName mobile')
      .lean();

    const outstandingMap = {};

    invoices.forEach(inv => {
      if (!inv.party) return;
      const partyId = inv.party._id.toString();
      const due = inv.grandTotal - (inv.paidAmount || 0);
      if (due <= 0) return;

      if (!outstandingMap[partyId]) {
        outstandingMap[partyId] = {
          party: inv.party,
          totalOutstanding: 0,
          invoices: []
        };
      }

      outstandingMap[partyId].totalOutstanding += due;
      outstandingMap[partyId].invoices.push({
        _id: inv._id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        grandTotal: inv.grandTotal,
        paidAmount: inv.paidAmount || 0,
        dueAmount: Math.round(due * 100) / 100,
        paymentStatus: inv.paymentStatus
      });
    });

    const result = Object.values(outstandingMap).map(item => ({
      ...item,
      totalOutstanding: Math.round(item.totalOutstanding * 100) / 100
    }));

    result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    res.json({
      success: true,
      data: result,
      totalOutstanding: result.reduce((sum, r) => sum + r.totalOutstanding, 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

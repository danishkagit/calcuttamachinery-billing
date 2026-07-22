const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Company = require('../models/Company');
const Party = require('../models/Party');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const StockMovement = require('../models/StockMovement');
const amountInWords = require('../utils/amountInWords');
const { protect } = require('../middleware/auth');
const { logAudit } = require('../middleware/auditLog');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

const calculateTax = (items, companyStateCode, partyStateCode) => {
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let cessTotal = 0;
  let totalBeforeTax = 0;
  let totalTax = 0;

  const calculatedItems = items.map(item => {
    const quantity = Number(item.quantity) || 1;
    const rate = Number(item.rate) || 0;
    const taxableValue = quantity * rate;
    const taxRate = Number(item.taxRate) || 0;
    const cess = Number(item.cess) || 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let itemCess = 0;
    let total = taxableValue;

    if (companyStateCode === partyStateCode) {
      cgst = (taxableValue * taxRate) / 2 / 100;
      sgst = (taxableValue * taxRate) / 2 / 100;
    } else {
      igst = (taxableValue * taxRate) / 100;
    }

    itemCess = (taxableValue * cess) / 100;
    total = taxableValue + cgst + sgst + igst + itemCess;

    subtotal += taxableValue;
    cgstTotal += cgst;
    sgstTotal += sgst;
    igstTotal += igst;
    cessTotal += itemCess;
    totalBeforeTax += taxableValue;
    totalTax += (cgst + sgst + igst + itemCess);

    return {
      product: item.product,
      description: item.description || '',
      quantity,
      unit: item.unit || 'Nos',
      rate,
      taxableValue,
      taxRate,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      cess: Math.round(itemCess * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  });

  const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal + cessTotal;
  const roundOff = Math.round(grandTotal) - grandTotal;

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    cgstTotal: Math.round(cgstTotal * 100) / 100,
    sgstTotal: Math.round(sgstTotal * 100) / 100,
    igstTotal: Math.round(igstTotal * 100) / 100,
    cessTotal: Math.round(cessTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    roundOff: Math.round(roundOff * 100) / 100,
    totalBeforeTax: Math.round(totalBeforeTax * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100
  };
};

const generateInvoiceNo = async (company, invoiceType) => {
  let prefix, nextNo, counterField;
  if (invoiceType === 'Credit Note') {
    prefix = 'CN-';
    nextNo = (company.lastCreditNoteNo || 0) + 1;
    counterField = 'lastCreditNoteNo';
  } else if (invoiceType === 'Debit Note') {
    prefix = 'DN-';
    nextNo = (company.lastDebitNoteNo || 0) + 1;
    counterField = 'lastDebitNoteNo';
  } else {
    prefix = company.invoicePrefix || 'INV-';
    nextNo = (company.lastInvoiceNo || 0) + 1;
    counterField = 'lastInvoiceNo';
  }
  const padded = String(nextNo).padStart(4, '0');
  return { invoiceNo: `${prefix}${padded}`, counterField, nextNo };
};

// ---------------------------------------------------------------------------
// Stock movement helpers
// ---------------------------------------------------------------------------

/**
 * Invoice types that affect physical inventory stock.
 * Only Tax Invoice and Bill of Supply are genuine dispatch / receipt documents.
 */
const STOCK_INVOICE_TYPES = new Set(['Tax Invoice', 'Bill of Supply']);

/**
 * Apply stock movements for a newly created (or fully replaced) invoice.
 *
 * For a SALE invoice  : quantity leaves the warehouse (negative delta).
 * For a PURCHASE invoice (party is Supplier): quantity arrives (positive delta).
 *
 * @param {object} invoice    – saved Invoice document (plain or mongoose)
 * @param {string} partyType  – 'Customer' | 'Supplier'
 * @param {string} userId
 * @param {mongoose.ClientSession} [session]
 */
async function applyStockMovements(invoice, partyType, userId, session) {
  if (!STOCK_INVOICE_TYPES.has(invoice.invoiceType)) return;

  const isPurchase = partyType === 'Supplier';
  const movementType = isPurchase ? 'purchase' : 'sale';

  const movementDocs = [];

  for (const item of invoice.items) {
    if (!item.product) continue; // free-text line with no linked product — skip

    const qty = Number(item.quantity) || 0;
    if (qty === 0) continue;

    // delta: positive for purchase (stock arrives), negative for sale (stock leaves)
    const delta = isPurchase ? qty : -qty;

    // Use findOneAndUpdate for atomicity — no session required for individual updates,
    // but we pass session when supplied (e.g. in adjustment route which uses a transaction).
    const updatedProduct = await Product.findByIdAndUpdate(
      item.product,
      { $inc: { openingStock: delta } },
      { new: true, session: session || null }
    );

    if (!updatedProduct) continue; // product may have been deleted

    movementDocs.push({
      userId,
      product:      item.product,
      invoice:      invoice._id,
      movementType,
      quantity:     delta,
      balanceAfter: updatedProduct.openingStock,
      notes:        `${movementType === 'sale' ? 'Sale' : 'Purchase'} via ${invoice.invoiceNo}`
    });
  }

  if (movementDocs.length > 0) {
    if (session) {
      await StockMovement.insertMany(movementDocs, { session });
    } else {
      await StockMovement.insertMany(movementDocs);
    }
  }
}

/**
 * Reverse stock movements that were applied for a given invoice.
 * Called on DELETE or before a full UPDATE that changes items.
 *
 * @param {object} invoice   – existing Invoice document
 * @param {string} partyType – 'Customer' | 'Supplier'
 */
async function reverseStockMovements(invoice, partyType) {
  if (!STOCK_INVOICE_TYPES.has(invoice.invoiceType)) return;

  const isPurchase = partyType === 'Supplier';

  for (const item of invoice.items) {
    if (!item.product) continue;

    const qty = Number(item.quantity) || 0;
    if (qty === 0) continue;

    // Reverse: sale reversal = add back, purchase reversal = subtract
    const delta = isPurchase ? -qty : qty;

    const updatedProduct = await Product.findByIdAndUpdate(
      item.product,
      { $inc: { openingStock: delta } },
      { new: true }
    );

    if (!updatedProduct) continue;

    await StockMovement.create({
      userId:       invoice.userId,
      product:      item.product,
      invoice:      invoice._id,
      movementType: 'adjustment',
      quantity:     delta,
      balanceAfter: updatedProduct.openingStock,
      notes:        `Reversal of ${invoice.invoiceNo} (${isPurchase ? 'purchase' : 'sale'} reversed)`
    });
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// POST /api/invoices — Create invoice
router.post('/', [
  body('party').notEmpty().withMessage('Party is required'),
  body('company').notEmpty().withMessage('Company is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
], protect, validate, async (req, res) => {
  try {
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const party = await Party.findById(req.body.party);
    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found' });
    }

    const invoiceType = req.body.invoiceType || 'Tax Invoice';
    const { invoiceNo, counterField, nextNo } = await generateInvoiceNo(company, invoiceType);

    const taxResult = calculateTax(req.body.items, company.stateCode, party.stateCode);

    const grandTotalRounded = Math.round(taxResult.grandTotal + taxResult.roundOff);
    const inWords = amountInWords(grandTotalRounded);

    const invoiceData = {
      ...req.body,
      userId: req.user._id,
      invoiceNo,
      invoiceType,
      ...taxResult,
      amountInWords: inWords,
      invoiceDate: req.body.invoiceDate || new Date(),
      placeOfSupply: party.state || ''
    };

    const invoice = await Invoice.create(invoiceData);

    company[counterField] = nextNo;
    await company.save();

    // Apply stock movements (non-blocking — errors are logged, not fatal)
    try {
      await applyStockMovements(invoice, party.partyType, req.user._id);
    } catch (stockErr) {
      console.error('[Inventory] Stock movement failed for invoice', invoice.invoiceNo, stockErr.message);
    }

    const populated = await Invoice.findById(invoice._id)
      .populate('party')
      .populate('company')
      .populate('items.product');

    // Audit log — fire and forget
    logAudit(
      req,
      'CREATE',
      'Invoice',
      invoice._id,
      invoice.invoiceNo,
      `Created ${invoiceType} ${invoiceNo} for party ${party.name}`,
      null,
      { invoiceNo, invoiceType, grandTotal: taxResult.grandTotal }
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/invoices/import — Bulk import
router.post('/import', protect, async (req, res) => {
  try {
    const rawInvoices = req.body;
    if (!Array.isArray(rawInvoices) || rawInvoices.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid data format. Expected an array of invoices.' });
    }

    const company = await Company.findOne(); // single-company setup
    if (!company) {
      return res.status(400).json({ success: false, error: 'Please setup company profile first.' });
    }

    const imported = [];
    const errors = [];

    for (let i = 0; i < rawInvoices.length; i++) {
      const invData = rawInvoices[i];
      try {
        let party = null;
        if (invData.partyGstin) {
          party = await Party.findOne({ gstin: invData.partyGstin });
        }
        if (!party && invData.partyName) {
          party = await Party.findOne({ name: new RegExp('^' + invData.partyName + '$', 'i') });
        }
        if (!party) {
          errors.push(`Row ${i + 1}: Party ${invData.partyName || invData.partyGstin} not found in database.`);
          continue;
        }

        const items = [];
        for (const item of (invData.items || [])) {
          let product = null;
          if (item.productName) {
            product = await Product.findOne({ name: new RegExp('^' + item.productName + '$', 'i') });
          }
          items.push({
            product: product ? product._id : null,
            description: item.description || (product ? product.name : ''),
            quantity: Number(item.quantity) || 1,
            unit: item.unit || (product ? product.unit : 'Nos'),
            rate: Number(item.rate) || 0,
            taxRate: Number(item.taxRate) || (product ? product.taxRate : 0),
            cess: Number(item.cess) || (product ? product.cess : 0)
          });
        }

        let invoiceNo = invData.invoiceNo;
        if (!invoiceNo) {
          const invType = invData.invoiceType || 'Tax Invoice';
          const result = await generateInvoiceNo(company, invType);
          invoiceNo = result.invoiceNo;
          company[result.counterField] = result.nextNo;
        }

        const taxResult = calculateTax(items, company.stateCode, party.stateCode);
        const grandTotalRounded = Math.round(taxResult.grandTotal + taxResult.roundOff);
        const inWords = amountInWords(grandTotalRounded);

        const newInvoice = await Invoice.create({
          userId: req.user ? req.user._id : null,
          invoiceNo,
          invoiceDate: invData.invoiceDate ? new Date(invData.invoiceDate) : new Date(),
          party: party._id,
          company: company._id,
          items: taxResult.items,
          subtotal: taxResult.subtotal,
          cgstTotal: taxResult.cgstTotal,
          sgstTotal: taxResult.sgstTotal,
          igstTotal: taxResult.igstTotal,
          cessTotal: taxResult.cessTotal,
          grandTotal: taxResult.grandTotal,
          roundOff: taxResult.roundOff,
          totalBeforeTax: taxResult.totalBeforeTax,
          totalTax: taxResult.totalTax,
          amountInWords: inWords,
          placeOfSupply: invData.placeOfSupply || party.state || '',
          invoiceType: invData.invoiceType || 'Tax Invoice',
          paymentStatus: invData.paymentStatus || 'Unpaid',
          paidAmount: Number(invData.paidAmount) || 0,
          paymentMethod: invData.paymentMethod || ''
        });

        // Apply stock movements for imported invoice (best-effort)
        try {
          await applyStockMovements(newInvoice, party.partyType, req.user ? req.user._id : null);
        } catch (stockErr) {
          console.error('[Inventory] Import stock movement failed:', stockErr.message);
        }

        imported.push(newInvoice);
      } catch (err) {
        if (err.code === 11000) {
          errors.push(`Row ${i + 1}: Invoice No ${invData.invoiceNo} already exists.`);
        } else {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    }

    if (company.isModified('lastInvoiceNo')) {
      await company.save();
    }

    res.status(201).json({
      success: true,
      count: imported.length,
      data: imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices — List with filters
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (req.query.search) {
      filter.$or = [
        { invoiceNo: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.startDate && req.query.endDate) {
      filter.invoiceDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    if (req.query.party) {
      filter.party = req.query.party;
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.invoiceType) {
      filter.invoiceType = req.query.invoiceType;
    }

    let query = Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('party', 'name companyName gstin')
      .populate('company', 'businessName gstin');

    if (req.query.search) {
      const partyMatches = await Party.find({
        name: { $regex: req.query.search, $options: 'i' }
      }).select('_id');

      const partyIds = partyMatches.map(p => p._id);
      if (partyIds.length > 0) {
        filter.$or.push({ party: { $in: partyIds } });
      }
      query = Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('party', 'name companyName gstin')
        .populate('company', 'businessName gstin');
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await query;

    res.json({
      success: true,
      data: invoices,
      count: invoices.length,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices/last/:companyId
router.get('/last/:companyId', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    res.json({
      success: true,
      data: {
        lastInvoiceNo: company.lastInvoiceNo || 0,
        invoicePrefix: company.invoicePrefix || 'INV-',
        nextInvoiceNo: (company.lastInvoiceNo || 0) + 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('party')
      .populate('company')
      .populate('items.product');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/invoices/:id — Update invoice
router.put('/:id', protect, async (req, res) => {
  try {
    const existing = await Invoice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const oldSnapshot = existing.toObject();

    // Capture party type for stock logic before we start mutating
    const party = await Party.findById(existing.party);

    // If items are being updated, reverse old stock movements first
    if (req.body.items && req.body.items.length > 0 && party) {
      try {
        await reverseStockMovements(existing, party.partyType);
      } catch (stockErr) {
        console.error('[Inventory] Stock reversal failed on update:', stockErr.message);
      }
    }

    let updateData = { ...req.body };
    delete updateData.invoiceNo; // invoice number is immutable

    if (req.body.items && req.body.items.length > 0) {
      const company = await Company.findById(existing.company);

      if (company && party) {
        const taxResult = calculateTax(req.body.items, company.stateCode, party.stateCode);
        const grandTotalRounded = Math.round(taxResult.grandTotal + taxResult.roundOff);
        const inWords = amountInWords(grandTotalRounded);

        updateData = { ...updateData, ...taxResult, amountInWords: inWords };
        if (req.body.placeOfSupply) updateData.placeOfSupply = req.body.placeOfSupply;
        if (!updateData.placeOfSupply) updateData.placeOfSupply = party.state || '';
      }
    }

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('party')
      .populate('company')
      .populate('items.product');

    // Apply new stock movements for updated items
    if (req.body.items && req.body.items.length > 0 && party) {
      try {
        await applyStockMovements(invoice, party.partyType, req.user._id);
      } catch (stockErr) {
        console.error('[Inventory] Stock movement failed on update:', stockErr.message);
      }
    }

    // Audit log
    logAudit(
      req,
      'UPDATE',
      'Invoice',
      invoice._id,
      invoice.invoiceNo,
      `Updated invoice ${invoice.invoiceNo}`,
      oldSnapshot,
      invoice.toObject()
    );

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const oldSnapshot = invoice.toObject();
    const party = await Party.findById(invoice.party);

    // Reverse stock movements before hard-deleting
    if (party) {
      try {
        await reverseStockMovements(invoice, party.partyType);
      } catch (stockErr) {
        console.error('[Inventory] Stock reversal failed on delete:', stockErr.message);
      }
    }

    // Nullify invoice reference on stock movements (keep the ledger, break the FK)
    await StockMovement.updateMany(
      { invoice: invoice._id },
      { $set: { notes: `${(await StockMovement.findOne({ invoice: invoice._id }))?.notes || ''} [invoice deleted]` } }
    );

    await Invoice.findByIdAndDelete(req.params.id);
    await Payment.deleteMany({ invoice: req.params.id });

    // Audit log
    logAudit(
      req,
      'DELETE',
      'Invoice',
      invoice._id,
      invoice.invoiceNo,
      `Deleted invoice ${invoice.invoiceNo}`,
      oldSnapshot,
      null
    );

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/invoices/:id/payment
router.post('/:id/payment', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentMethod').isIn(['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card', 'Others'])
    .withMessage('Invalid payment method'),
], protect, validate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const paymentAmount = Number(req.body.amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be positive' });
    }

    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;

    if (newPaidAmount > invoice.grandTotal) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount exceeds invoice total'
      });
    }

    let paymentStatus = 'Partial';
    if (newPaidAmount >= invoice.grandTotal) {
      paymentStatus = 'Paid';
    }

    invoice.paidAmount = newPaidAmount;
    invoice.paymentStatus = paymentStatus;
    if (req.body.paymentMethod) invoice.paymentMethod = req.body.paymentMethod;
    await invoice.save();

    const payment = await Payment.create({
      invoice: invoice._id,
      party: invoice.party,
      amount: paymentAmount,
      paymentDate: req.body.paymentDate || new Date(),
      paymentMethod: req.body.paymentMethod,
      reference: req.body.reference || '',
      notes: req.body.notes || ''
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        invoice: {
          _id: invoice._id,
          invoiceNo: invoice.invoiceNo,
          paidAmount: invoice.paidAmount,
          paymentStatus: invoice.paymentStatus,
          grandTotal: invoice.grandTotal
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Company = require('../models/Company');
const Party = require('../models/Party');
const Payment = require('../models/Payment');
const amountInWords = require('../utils/amountInWords');
const { protect } = require('../middleware/auth');

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

    const populated = await Invoice.findById(invoice._id)
      .populate('party')
      .populate('company')
      .populate('items.product');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', protect, async (req, res) => {
  try {
    const rawInvoices = req.body;
    if (!Array.isArray(rawInvoices) || rawInvoices.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid data format. Expected an array of invoices.' });
    }

    const company = await Company.findOne(); // Assuming single company setup
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
          errors.push(`Row ${i+1}: Party ${invData.partyName || invData.partyGstin} not found in database.`);
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
          userId: req.user ? req.user.id : null,
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
        
        imported.push(newInvoice);
      } catch (err) {
        if (err.code === 11000) {
           errors.push(`Row ${i+1}: Invoice No ${invData.invoiceNo} already exists.`);
        } else {
           errors.push(`Row ${i+1}: ${err.message}`);
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

router.put('/:id', protect, async (req, res) => {
  try {
    const existing = await Invoice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    let updateData = { ...req.body };
    delete updateData.invoiceNo;

    if (req.body.items && req.body.items.length > 0) {
      const company = await Company.findById(existing.company);
      const party = await Party.findById(existing.party);

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

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    await Payment.deleteMany({ invoice: req.params.id });

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Company = require('./models/Company');
const Party = require('./models/Party');
const Product = require('./models/Product');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Expense = require('./models/Expense');
const StockMovement = require('./models/StockMovement');
const FilingHistory = require('./models/FilingHistory');
const AuditLog = require('./models/AuditLog');
const amountInWords = require('./utils/amountInWords');

dotenv.config();

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

async function createOpeningStockMovements(userId, products) {
  const movements = products.map(p => ({
    userId,
    product: p._id,
    invoice: null,
    movementType: 'opening',
    quantity: p.openingStock,
    balanceAfter: p.openingStock,
    notes: 'Opening stock'
  }));
  await StockMovement.insertMany(movements);
}

async function createInvoiceWithStock(userId, company, party, invoiceData, items, invoiceType) {
  const taxResult = calculateTax(items, company.stateCode, party.stateCode);
  const grandTotalRounded = Math.round(taxResult.grandTotal + taxResult.roundOff);
  const inWords = amountInWords(grandTotalRounded);

  const invoice = await Invoice.create({
    userId,
    invoiceNo: invoiceData.invoiceNo,
    invoiceDate: invoiceData.invoiceDate,
    dueDate: invoiceData.dueDate || null,
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
    placeOfSupply: party.state || '',
    invoiceType,
    paymentStatus: invoiceData.paymentStatus || 'Unpaid',
    paidAmount: invoiceData.paidAmount || 0,
    paymentMethod: invoiceData.paymentMethod || '',
    transportMode: invoiceData.transportMode || '',
    vehicleNo: invoiceData.vehicleNo || '',
    transportName: invoiceData.transportName || '',
    eWayBillNo: invoiceData.eWayBillNo || '',
    notes: invoiceData.notes || '',
    termsAndConditions: invoiceData.termsAndConditions || ''
  });

  const isStockType = invoiceType === 'Tax Invoice' || invoiceType === 'Bill of Supply';
  if (isStockType && party.partyType === 'Customer') {
    const movementDocs = [];
    for (const item of taxResult.items) {
      if (!item.product) continue;
      const qty = Number(item.quantity) || 0;
      if (qty === 0) continue;
      const delta = -qty;
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { openingStock: delta } },
        { new: true }
      );
      if (!updatedProduct) continue;
      movementDocs.push({
        userId,
        product: item.product,
        invoice: invoice._id,
        movementType: 'sale',
        quantity: delta,
        balanceAfter: updatedProduct.openingStock,
        notes: `Sale via ${invoice.invoiceNo}`
      });
    }
    if (movementDocs.length > 0) {
      await StockMovement.insertMany(movementDocs);
    }
  }

  if (isStockType && party.partyType === 'Supplier') {
    const movementDocs = [];
    for (const item of taxResult.items) {
      if (!item.product) continue;
      const qty = Number(item.quantity) || 0;
      if (qty === 0) continue;
      const delta = qty;
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { openingStock: delta } },
        { new: true }
      );
      if (!updatedProduct) continue;
      movementDocs.push({
        userId,
        product: item.product,
        invoice: invoice._id,
        movementType: 'purchase',
        quantity: delta,
        balanceAfter: updatedProduct.openingStock,
        notes: `Purchase via ${invoice.invoiceNo}`
      });
    }
    if (movementDocs.length > 0) {
      await StockMovement.insertMany(movementDocs);
    }
  }

  return invoice;
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = ['users', 'companies', 'parties', 'products', 'invoices', 'payments', 'expenses', 'stockmovements', 'auditlogs', 'filinghistories', 'staffinvites'];
    for (const name of collections) {
      const coll = await mongoose.connection.db.listCollections({ name }).next();
      if (coll) {
        await mongoose.connection.db.dropCollection(name);
        console.log(`  Dropped collection: ${name}`);
      }
    }

    // =========================================================================
    // 1. USER
    // =========================================================================
    console.log('\nCreating admin user...');
    const user = await User.create({
      name: 'Admin',
      email: 'admin@calcutta.com',
      password: 'admin123',
      phone: '9876543210',
      role: 'admin'
    });
    console.log(`  Admin user: ${user.email}`);

    // =========================================================================
    // 2. COMPANY
    // =========================================================================
    console.log('Creating company profile...');
    const company = await Company.create({
      userId: user._id,
      businessName: 'Calcutta Machinery',
      address: '15, Dr. Noorie Lane No.1, Champdani',
      city: 'Baidyabati',
      state: 'West Bengal',
      stateCode: 19,
      pincode: '712222',
      gstin: '19ALUPS4733P1ZW',
      pan: 'ALUPS4733P',
      email: 'admin@calcutta.com',
      mobile: '9876543210',
      bankName: 'State Bank of India',
      accountNo: '12345678901234',
      ifscCode: 'SBIN0001234',
      upiId: 'calcutta@upi',
      upiQrEnabled: true,
      invoicePrefix: 'INV-',
      lastInvoiceNo: 0,
      lastCreditNoteNo: 0,
      lastDebitNoteNo: 0,
      defaultTemplate: 'classic'
    });
    console.log(`  Company: ${company.businessName}`);

    // =========================================================================
    // 3. PARTIES — 6 Customers, 4 Suppliers
    // =========================================================================
    console.log('Creating parties...');
    const parties = await Party.insertMany([
      {
        userId: user._id, partyType: 'Customer',
        name: 'Rajesh Sharma', companyName: 'Sharma Traders',
        gstin: '19ABCDE1234F1Z5', mobile: '9832100001',
        email: 'rajesh@sharmatraders.com',
        address: '12, College Road', city: 'Kolkata', state: 'West Bengal',
        stateCode: 19, pincode: '700001', openingBalance: 0, creditLimit: 50000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Customer',
        name: 'Priya Das', companyName: 'Das Enterprises',
        gstin: '19FGHIJ5678K1Z5', mobile: '9832100002',
        email: 'priya@dasenterprises.com',
        address: '45, Lake Market', city: 'Kolkata', state: 'West Bengal',
        stateCode: 19, pincode: '700029', openingBalance: 2500, creditLimit: 30000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Customer',
        name: 'Vikram Ghosh', companyName: 'Ghosh Engineering Solutions',
        gstin: '19VWXYZ7890M1Z5', mobile: '9832100005',
        email: 'vikram@ghoshengineering.com',
        address: '33, B.T. Road', city: 'Kolkata', state: 'West Bengal',
        stateCode: 19, pincode: '700056', openingBalance: 0, creditLimit: 20000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Customer',
        name: 'Ananya Gupta', companyName: 'Gupta Industrial Supplies',
        gstin: '06LKJH9876G1Z5', mobile: '9832100006',
        email: 'ananya@guptaindustrial.com',
        address: '78, MG Road', city: 'Mumbai', state: 'Maharashtra',
        stateCode: 27, pincode: '400001', openingBalance: 0, creditLimit: 60000, group: 'Wholesale'
      },
      {
        userId: user._id, partyType: 'Customer',
        name: 'Ravi Patel', companyName: 'Patel Fabrication Works',
        gstin: '24MNOP3456Q1Z5', mobile: '9832100007',
        email: 'ravi@patelfab.com',
        address: '56, Industrial Area', city: 'Ahmedabad', state: 'Gujarat',
        stateCode: 24, pincode: '380001', openingBalance: 5000, creditLimit: 40000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Customer',
        name: 'Sneha Mishra', companyName: 'Mishra Construction Co.',
        gstin: '09TUVW1234A1Z5', mobile: '9832100008',
        email: 'sneha@mishraconstruction.com',
        address: '22, Station Road', city: 'Lucknow', state: 'Uttar Pradesh',
        stateCode: 9, pincode: '226001', openingBalance: 0, creditLimit: 35000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Supplier',
        name: 'Amit Singhania', companyName: 'Singhania Steel Works',
        gstin: '19KLMNO9012P1Z5', mobile: '9832100003',
        email: 'amit@singhaniasteel.com',
        address: '8, GT Road', city: 'Howrah', state: 'West Bengal',
        stateCode: 19, pincode: '711101', openingBalance: 0, creditLimit: 100000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Supplier',
        name: 'Sushmita Roy', companyName: 'Roy Packaging House',
        gstin: '19PQRST3456U1Z5', mobile: '9832100004',
        email: 'sushmita@roypackaging.com',
        address: '22, Station Road', city: 'Baidyabati', state: 'West Bengal',
        stateCode: 19, pincode: '712222', openingBalance: 12000, creditLimit: 75000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Supplier',
        name: 'Mohit Agarwal', companyName: 'Agarwal Electricals',
        gstin: '19EFGH5678I1Z5', mobile: '9832100009',
        email: 'mohit@agarwalelectricals.com',
        address: '15, College Street', city: 'Kolkata', state: 'West Bengal',
        stateCode: 19, pincode: '700073', openingBalance: 0, creditLimit: 50000, group: 'General'
      },
      {
        userId: user._id, partyType: 'Supplier',
        name: 'Pooja Verma', companyName: 'Verma Lubricants',
        gstin: '19QRST9012V1Z5', mobile: '9832100010',
        email: 'pooja@vermalubricants.com',
        address: '44, Bypass Road', city: 'Howrah', state: 'West Bengal',
        stateCode: 19, pincode: '711102', openingBalance: 0, creditLimit: 30000, group: 'General'
      }
    ]);
    const [rajesh, priya, vikram, ananya, ravi, sneha, amit, sushmita, mohit, pooja] = parties;
    console.log(`  ${parties.length} parties created`);

    // =========================================================================
    // 4. PRODUCTS — 15 products
    // =========================================================================
    console.log('Creating products...');
    const products = await Product.insertMany([
      {
        userId: user._id, name: 'Industrial Bearing',
        description: 'Ball bearing 6205ZZ for heavy machinery',
        unit: 'Nos', hsnCode: '8482', taxRate: 18, cess: 0,
        sellingPrice: 450, purchasePrice: 320, openingStock: 150, lowStockAlert: 20, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Steel Roller Chain',
        description: '16B-1 roller chain 10 ft length',
        unit: 'Nos', hsnCode: '7315', taxRate: 18, cess: 0,
        sellingPrice: 1200, purchasePrice: 850, openingStock: 80, lowStockAlert: 10, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Hydraulic Oil',
        description: 'ISO VG 68 hydraulic oil - 20L can',
        unit: 'Ltrs', hsnCode: '2710', taxRate: 18, cess: 0,
        sellingPrice: 3200, purchasePrice: 2500, openingStock: 40, lowStockAlert: 5, gstType: 'gst'
      },
      {
        userId: user._id, name: 'High Tensile Bolt',
        description: 'M16 x 60mm high tensile bolt with nut',
        unit: 'Nos', hsnCode: '7318', taxRate: 18, cess: 0,
        sellingPrice: 15, purchasePrice: 8, openingStock: 2000, lowStockAlert: 200, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Copper Wire',
        description: '1.5 sqmm single core copper wire (90m roll)',
        unit: 'Nos', hsnCode: '7408', taxRate: 18, cess: 0,
        sellingPrice: 1800, purchasePrice: 1350, openingStock: 60, lowStockAlert: 10, gstType: 'gst'
      },
      {
        userId: user._id, name: 'PVC Insulation Tape',
        description: 'Electrical grade PVC tape 18mm x 20m',
        unit: 'Pcs', hsnCode: '3919', taxRate: 18, cess: 0,
        sellingPrice: 45, purchasePrice: 28, openingStock: 500, lowStockAlert: 50, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Welding Electrode',
        description: 'E6013 mild steel welding electrode 3.15mm',
        unit: 'Kgs', hsnCode: '8311', taxRate: 18, cess: 0,
        sellingPrice: 110, purchasePrice: 75, openingStock: 300, lowStockAlert: 30, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Rubber Gasket Sheet',
        description: '3mm industrial rubber gasket sheet 1m x 1m',
        unit: 'Nos', hsnCode: '4016', taxRate: 18, cess: 0,
        sellingPrice: 650, purchasePrice: 420, openingStock: 100, lowStockAlert: 15, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Cutting Oil',
        description: 'Soluble cutting oil 5L bottle',
        unit: 'Ltrs', hsnCode: '3403', taxRate: 18, cess: 0,
        sellingPrice: 850, purchasePrice: 580, openingStock: 75, lowStockAlert: 10, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Compressor Belt',
        description: 'A-38 V-belt for air compressor',
        unit: 'Nos', hsnCode: '4010', taxRate: 18, cess: 0,
        sellingPrice: 280, purchasePrice: 180, openingStock: 120, lowStockAlert: 20, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Electric Motor',
        description: '2 HP 3-phase induction motor',
        unit: 'Nos', hsnCode: '8501', taxRate: 18, cess: 0,
        sellingPrice: 8500, purchasePrice: 6200, openingStock: 15, lowStockAlert: 3, gstType: 'gst'
      },
      {
        userId: user._id, name: 'LED Flood Light',
        description: '50W LED flood light IP65',
        unit: 'Nos', hsnCode: '9405', taxRate: 12, cess: 0,
        sellingPrice: 1200, purchasePrice: 850, openingStock: 200, lowStockAlert: 20, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Air Filter Element',
        description: 'Heavy duty air filter for compressors',
        unit: 'Nos', hsnCode: '8421', taxRate: 18, cess: 0,
        sellingPrice: 550, purchasePrice: 380, openingStock: 90, lowStockAlert: 10, gstType: 'gst'
      },
      {
        userId: user._id, name: 'V-Belt Set',
        description: 'SPB-2000 V-belt set of 3',
        unit: 'Set', hsnCode: '4010', taxRate: 18, cess: 0,
        sellingPrice: 950, purchasePrice: 680, openingStock: 45, lowStockAlert: 5, gstType: 'gst'
      },
      {
        userId: user._id, name: 'Grease Gun',
        description: 'Heavy duty lever type grease gun 500ml',
        unit: 'Nos', hsnCode: '8467', taxRate: 18, cess: 0,
        sellingPrice: 750, purchasePrice: 520, openingStock: 35, lowStockAlert: 5, gstType: 'gst'
      }
    ]);
    const [bearing, chain, hydraulicOil, bolt, copperWire, tape, electrode, gasket, cuttingOil, compressorBelt, motor, floodLight, airFilter, vBelt, greaseGun] = products;
    console.log(`  ${products.length} products created`);

    // =========================================================================
    // Opening stock movements (baseline ledger)
    // =========================================================================
    console.log('Creating opening stock movements...');
    await createOpeningStockMovements(user._id, products);
    console.log(`  opening stock movements created`);

    // =========================================================================
    // 5. INVOICES
    // =========================================================================
    console.log('Creating invoices...');

    // Update company invoice counters
    company.lastInvoiceNo = 8;
    company.lastCreditNoteNo = 2;
    company.lastDebitNoteNo = 1;
    await company.save();

    // --- Invoice 1: Tax Invoice to Rajesh (same state - Kolkata) ---
    const inv1 = await createInvoiceWithStock(user._id, company, rajesh, {
      invoiceNo: 'INV-0001',
      invoiceDate: new Date('2026-06-05'),
      paymentStatus: 'Paid', paidAmount: 0,
      transportMode: 'Road', vehicleNo: 'WB-1234',
      transportName: 'Express Logistics',
      notes: 'Deliver to factory gate',
      termsAndConditions: 'Payment within 30 days',
      eWayBillNo: 'EWB123456789'
    }, [
      { product: bearing._id, description: 'Ball bearing 6205ZZ', quantity: 10, unit: 'Nos', rate: 450, taxRate: 18 },
      { product: chain._id, description: 'Steel roller chain 16B-1', quantity: 5, unit: 'Nos', rate: 1200, taxRate: 18 },
      { product: tape._id, description: 'PVC insulation tape', quantity: 50, unit: 'Pcs', rate: 45, taxRate: 18 }
    ], 'Tax Invoice');

    // --- Invoice 2: Tax Invoice to Priya (same state) ---
    const inv2 = await createInvoiceWithStock(user._id, company, priya, {
      invoiceNo: 'INV-0002',
      invoiceDate: new Date('2026-06-10'),
      paymentStatus: 'Unpaid', paidAmount: 0,
      transportMode: 'Road', vehicleNo: 'WB-5678',
      transportName: 'Speed Cargo',
      notes: 'Handle with care'
    }, [
      { product: hydraulicOil._id, description: 'Hydraulic oil ISO VG 68 20L', quantity: 4, unit: 'Ltrs', rate: 3200, taxRate: 18 },
      { product: compressorBelt._id, description: 'Compressor V-belt A-38', quantity: 12, unit: 'Nos', rate: 280, taxRate: 18 }
    ], 'Tax Invoice');

    // --- Invoice 3: Tax Invoice to Ananya (inter-state - Maharashtra) ---
    const inv3 = await createInvoiceWithStock(user._id, company, ananya, {
      invoiceNo: 'INV-0003',
      invoiceDate: new Date('2026-06-15'),
      paymentStatus: 'Partial', paidAmount: 25000,
      transportMode: 'Rail', transportName: 'Indian Railways',
      eWayBillNo: 'EWB987654321',
      notes: 'Consignment to Mumbai warehouse'
    }, [
      { product: motor._id, description: '2 HP 3-phase induction motor', quantity: 3, unit: 'Nos', rate: 8500, taxRate: 18 },
      { product: copperWire._id, description: '1.5 sqmm copper wire roll', quantity: 10, unit: 'Nos', rate: 1800, taxRate: 18 }
    ], 'Tax Invoice');

    inv3.paidAmount = 25000;
    inv3.paymentStatus = 'Partial';
    await inv3.save();

    // --- Invoice 4: Tax Invoice to Ravi (inter-state - Gujarat) ---
    const inv4 = await createInvoiceWithStock(user._id, company, ravi, {
      invoiceNo: 'INV-0004',
      invoiceDate: new Date('2026-06-18'),
      paymentStatus: 'Paid', paidAmount: 0,
      transportMode: 'Road', vehicleNo: 'GJ-9012',
      transportName: 'Gujarat Logistics'
    }, [
      { product: electrode._id, description: 'Welding electrode E6013 3.15mm', quantity: 100, unit: 'Kgs', rate: 110, taxRate: 18 },
      { product: gasket._id, description: 'Rubber gasket sheet 3mm', quantity: 15, unit: 'Nos', rate: 650, taxRate: 18 },
      { product: bolt._id, description: 'High tensile bolt M16', quantity: 500, unit: 'Nos', rate: 15, taxRate: 18 }
    ], 'Tax Invoice');

    // --- Invoice 5: Tax Invoice to Sneha (inter-state - UP) ---
    const inv5 = await createInvoiceWithStock(user._id, company, sneha, {
      invoiceNo: 'INV-0005',
      invoiceDate: new Date('2026-06-20'),
      paymentStatus: 'Unpaid', paidAmount: 0,
      transportMode: 'Road', vehicleNo: 'UP-3456',
      notes: 'Site delivery needed'
    }, [
      { product: floodLight._id, description: 'LED flood light 50W IP65', quantity: 25, unit: 'Nos', rate: 1200, taxRate: 12 },
      { product: cuttingOil._id, description: 'Cutting oil 5L bottle', quantity: 10, unit: 'Ltrs', rate: 850, taxRate: 18 }
    ], 'Tax Invoice');

    // --- Invoice 6: Tax Invoice to Vikram (same state) ---
    const inv6 = await createInvoiceWithStock(user._id, company, vikram, {
      invoiceNo: 'INV-0006',
      invoiceDate: new Date('2026-06-22'),
      paymentStatus: 'Paid', paidAmount: 0,
      transportMode: 'Road', vehicleNo: 'WB-4321',
      notes: ''
    }, [
      { product: airFilter._id, description: 'Air filter element heavy duty', quantity: 8, unit: 'Nos', rate: 550, taxRate: 18 },
      { product: vBelt._id, description: 'SPB-2000 V-belt set of 3', quantity: 6, unit: 'Set', rate: 950, taxRate: 18 },
      { product: greaseGun._id, description: 'Grease gun 500ml lever type', quantity: 4, unit: 'Nos', rate: 750, taxRate: 18 }
    ], 'Tax Invoice');

    // --- Invoice 7: Tax Invoice to Rajesh again (same state) ---
    const inv7 = await createInvoiceWithStock(user._id, company, rajesh, {
      invoiceNo: 'INV-0007',
      invoiceDate: new Date('2026-07-01'),
      paymentStatus: 'Unpaid', paidAmount: 0,
      transportMode: 'Road', vehicleNo: 'WB-7890',
      notes: 'Urgent delivery'
    }, [
      { product: bearing._id, description: 'Ball bearing 6205ZZ', quantity: 20, unit: 'Nos', rate: 450, taxRate: 18 },
      { product: hydraulicOil._id, description: 'Hydraulic oil ISO VG 68', quantity: 2, unit: 'Ltrs', rate: 3200, taxRate: 18 }
    ], 'Tax Invoice');

    // --- Invoice 8: Tax Invoice to Ananya again (inter-state) ---
    const inv8 = await createInvoiceWithStock(user._id, company, ananya, {
      invoiceNo: 'INV-0008',
      invoiceDate: new Date('2026-07-05'),
      paymentStatus: 'Unpaid', paidAmount: 0,
      transportMode: 'Air', transportName: 'Blue Dart',
      notes: 'Express delivery to Mumbai'
    }, [
      { product: motor._id, description: '2 HP 3-phase induction motor', quantity: 2, unit: 'Nos', rate: 8500, taxRate: 18 },
      { product: chain._id, description: 'Steel roller chain 16B-1', quantity: 8, unit: 'Nos', rate: 1200, taxRate: 18 }
    ], 'Tax Invoice');

    // --- Invoice 9: Credit Note to Priya (same state) ---
    const inv9 = await createInvoiceWithStock(user._id, company, priya, {
      invoiceNo: 'CN-0001',
      invoiceDate: new Date('2026-06-25'),
      paymentStatus: 'Paid', paidAmount: 0,
      notes: 'Credit for returned defective hydraulic oil'
    }, [
      { product: hydraulicOil._id, description: 'Hydraulic oil - returned defective', quantity: 4, unit: 'Ltrs', rate: 3200, taxRate: 18 }
    ], 'Credit Note');

    // --- Invoice 10: Credit Note to Ravi (inter-state) ---
    const inv10 = await createInvoiceWithStock(user._id, company, ravi, {
      invoiceNo: 'CN-0002',
      invoiceDate: new Date('2026-06-28'),
      paymentStatus: 'Paid', paidAmount: 0,
      notes: 'Credit for excess billing adjustment'
    }, [
      { product: gasket._id, description: 'Gasket sheet - rate adjustment', quantity: 15, unit: 'Nos', rate: 650, taxRate: 18 }
    ], 'Credit Note');

    // --- Invoice 11: Bill of Supply to Sneha (inter-state) ---
    const inv11 = await createInvoiceWithStock(user._id, company, sneha, {
      invoiceNo: 'BOS-0001',
      invoiceDate: new Date('2026-07-02'),
      paymentStatus: 'Unpaid', paidAmount: 0,
      notes: 'Bill of Supply - composite supply'
    }, [
      { product: tape._id, description: 'PVC insulation tape', quantity: 100, unit: 'Pcs', rate: 45, taxRate: 0 },
      { product: bolt._id, description: 'High tensile bolt M16', quantity: 200, unit: 'Nos', rate: 15, taxRate: 0 }
    ], 'Bill of Supply');

    // --- Invoice 12: Debit Note to Amit (Supplier - same state) ---
    const inv12 = await createInvoiceWithStock(user._id, company, amit, {
      invoiceNo: 'DN-0001',
      invoiceDate: new Date('2026-06-30'),
      paymentStatus: 'Paid', paidAmount: 0,
      notes: 'Debit note for short delivery'
    }, [
      { product: bearing._id, description: 'Bearing - short delivery adjustment', quantity: 5, unit: 'Nos', rate: 320, taxRate: 18 }
    ], 'Debit Note');

    const createdInvoices = [inv1, inv2, inv3, inv4, inv5, inv6, inv7, inv8, inv9, inv10, inv11, inv12];
    console.log(`  ${createdInvoices.length} invoices created`);

    // =========================================================================
    // 6. PAYMENTS
    // =========================================================================
    console.log('Creating payments...');
    const payments = await Payment.insertMany([
      {
        userId: user._id, invoice: inv1._id, party: rajesh._id,
        amount: inv1.grandTotal, paymentDate: new Date('2026-06-06'),
        paymentMethod: 'Bank Transfer', reference: 'NEFT123456',
        notes: 'Full payment for INV-0001'
      },
      {
        userId: user._id, invoice: inv3._id, party: ananya._id,
        amount: 25000, paymentDate: new Date('2026-06-20'),
        paymentMethod: 'UPI', reference: 'ananya@upi',
        notes: 'Partial payment for INV-0003'
      },
      {
        userId: user._id, invoice: inv4._id, party: ravi._id,
        amount: inv4.grandTotal, paymentDate: new Date('2026-06-22'),
        paymentMethod: 'Cheque', reference: 'CHQ-789012',
        notes: 'Full payment via cheque'
      },
      {
        userId: user._id, invoice: inv6._id, party: vikram._id,
        amount: inv6.grandTotal, paymentDate: new Date('2026-06-28'),
        paymentMethod: 'Cash', reference: '',
        notes: 'Cash payment received'
      },
      {
        userId: user._id, invoice: inv1._id, party: rajesh._id,
        amount: 5000, paymentDate: new Date('2026-07-02'),
        paymentMethod: 'Bank Transfer', reference: 'NEFT654321',
        notes: 'Advance payment for next order'
      }
    ]);
    console.log(`  ${payments.length} payments created`);

    // Update payment status on invoices based on payments
    inv1.paidAmount = inv1.grandTotal + 5000;
    inv1.paymentStatus = 'Paid';
    await inv1.save();

    inv4.paidAmount = inv4.grandTotal;
    inv4.paymentStatus = 'Paid';
    await inv4.save();

    inv6.paidAmount = inv6.grandTotal;
    inv6.paymentStatus = 'Paid';
    await inv6.save();

    // =========================================================================
    // 7. EXPENSES
    // =========================================================================
    console.log('Creating expenses...');
    const expenses = await Expense.insertMany([
      {
        userId: user._id, company: company._id,
        category: 'Office Rent', description: 'Monthly office rent June 2026',
        amount: 25000, expenseDate: new Date('2026-06-01'),
        paymentMode: 'Bank Transfer', reference: 'RENT-JUNE', notes: 'Factory premise rent'
      },
      {
        userId: user._id, company: company._id,
        category: 'Electricity', description: 'Electricity bill June 2026',
        amount: 8500, expenseDate: new Date('2026-06-05'),
        paymentMode: 'UPI', reference: 'EBILL-JUNE', notes: 'CESC bill'
      },
      {
        userId: user._id, company: company._id,
        category: 'Salary', description: 'Staff salaries June 2026',
        amount: 75000, expenseDate: new Date('2026-06-30'),
        paymentMode: 'Bank Transfer', reference: 'SAL-JUNE', notes: '5 staff members'
      },
      {
        userId: user._id, company: company._id,
        category: 'Transport', description: 'Logistics charges - Kolkata delivery',
        amount: 3200, expenseDate: new Date('2026-06-08'),
        paymentMode: 'Cash', reference: 'LR-1234', notes: 'Local transport'
      },
      {
        userId: user._id, company: company._id,
        category: 'Raw Material', description: 'Steel sheets for fabrication',
        amount: 45000, expenseDate: new Date('2026-06-12'),
        paymentMode: 'Bank Transfer', reference: 'PO-5678', notes: 'From Singhania Steel'
      },
      {
        userId: user._id, company: company._id,
        category: 'Packaging', description: 'Cardboard boxes and packing material',
        amount: 3800, expenseDate: new Date('2026-06-15'),
        paymentMode: 'Cash', reference: '', notes: 'Local purchase'
      },
      {
        userId: user._id, company: company._id,
        category: 'Maintenance', description: 'Machine servicing - lathe machine',
        amount: 6500, expenseDate: new Date('2026-06-18'),
        paymentMode: 'UPI', reference: 'SERVICE-01', notes: 'Annual maintenance'
      },
      {
        userId: user._id, company: company._id,
        category: 'Marketing', description: 'Google Ads campaign June 2026',
        amount: 5000, expenseDate: new Date('2026-06-20'),
        paymentMode: 'Card', reference: 'ADS-JUNE', notes: 'Digital marketing'
      },
      {
        userId: user._id, company: company._id,
        category: 'Stationery', description: 'Office stationery supplies',
        amount: 1200, expenseDate: new Date('2026-06-22'),
        paymentMode: 'Cash', reference: '', notes: 'Pens, paper, ink'
      },
      {
        userId: user._id, company: company._id,
        category: 'Telephone', description: 'Broadband and mobile bills',
        amount: 2400, expenseDate: new Date('2026-06-25'),
        paymentMode: 'UPI', reference: 'TEL-JUNE', notes: 'Jio fiber + 3 mobiles'
      }
    ]);
    console.log(`  ${expenses.length} expenses created`);

    // =========================================================================
    // 8. FILING HISTORY
    // =========================================================================
    console.log('Creating GST filing history...');
    const filings = await FilingHistory.insertMany([
      {
        userId: user._id, returnType: 'GSTR-1', period: '2026-04',
        status: 'filed', filedAt: new Date('2026-05-10'),
        acknowledgmentNo: 'ACK-G1-0426-001', companyId: company._id
      },
      {
        userId: user._id, returnType: 'GSTR-3B', period: '2026-04',
        status: 'filed', filedAt: new Date('2026-05-15'),
        acknowledgmentNo: 'ACK-G3B-0426-001', companyId: company._id
      },
      {
        userId: user._id, returnType: 'GSTR-1', period: '2026-05',
        status: 'filed', filedAt: new Date('2026-06-10'),
        acknowledgmentNo: 'ACK-G1-0526-001', companyId: company._id
      },
      {
        userId: user._id, returnType: 'GSTR-3B', period: '2026-05',
        status: 'filed', filedAt: new Date('2026-06-15'),
        acknowledgmentNo: 'ACK-G3B-0526-001', companyId: company._id
      }
    ]);
    console.log(`  ${filings.length} filing history records created`);

    // =========================================================================
    // 9. AUDIT LOGS
    // =========================================================================
    console.log('Creating audit logs...');
    const auditLogs = await AuditLog.insertMany([
      {
        userId: user._id, action: 'CREATE', resource: 'Company',
        resourceId: company._id, resourceNo: company.businessName,
        description: 'Company profile created via seed', ipAddress: '127.0.0.1'
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Invoice',
        resourceId: inv1._id, resourceNo: inv1.invoiceNo,
        description: `Created Tax Invoice ${inv1.invoiceNo} for ${rajesh.name}`,
        ipAddress: '127.0.0.1', newValues: { invoiceNo: inv1.invoiceNo, grandTotal: inv1.grandTotal }
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Invoice',
        resourceId: inv2._id, resourceNo: inv2.invoiceNo,
        description: `Created Tax Invoice ${inv2.invoiceNo} for ${priya.name}`,
        ipAddress: '127.0.0.1', newValues: { invoiceNo: inv2.invoiceNo, grandTotal: inv2.grandTotal }
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Invoice',
        resourceId: inv3._id, resourceNo: inv3.invoiceNo,
        description: `Created Tax Invoice ${inv3.invoiceNo} for ${ananya.name}`,
        ipAddress: '127.0.0.1', newValues: { invoiceNo: inv3.invoiceNo, grandTotal: inv3.grandTotal }
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Invoice',
        resourceId: inv4._id, resourceNo: inv4.invoiceNo,
        description: `Created Tax Invoice ${inv4.invoiceNo} for ${ravi.name}`,
        ipAddress: '127.0.0.1', newValues: { invoiceNo: inv4.invoiceNo, grandTotal: inv4.grandTotal }
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Payment',
        resourceId: payments[0]._id, resourceNo: inv1.invoiceNo,
        description: `Payment of ${payments[0].amount} received for ${inv1.invoiceNo}`,
        ipAddress: '127.0.0.1'
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Payment',
        resourceId: payments[2]._id, resourceNo: inv4.invoiceNo,
        description: `Payment of ${payments[2].amount} received for ${inv4.invoiceNo}`,
        ipAddress: '127.0.0.1'
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Expense',
        resourceId: expenses[0]._id, resourceNo: 'Office Rent',
        description: 'Monthly office rent expense recorded', ipAddress: '127.0.0.1'
      },
      {
        userId: user._id, action: 'CREATE', resource: 'Expense',
        resourceId: expenses[2]._id, resourceNo: 'Salary',
        description: 'Staff salaries expense recorded', ipAddress: '127.0.0.1'
      }
    ]);
    console.log(`  ${auditLogs.length} audit logs created`);

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n========================================');
    console.log('  SEED COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log(`  Users:          1`);
    console.log(`  Companies:      1`);
    console.log(`  Parties:        ${parties.length} (6 Customers, 4 Suppliers)`);
    console.log(`  Products:       ${products.length}`);
    console.log(`  Invoices:       ${createdInvoices.length} (8 Tax Invoice, 2 Credit Note, 1 Bill of Supply, 1 Debit Note)`);
    console.log(`  Payments:       ${payments.length}`);
    console.log(`  Expenses:       ${expenses.length}`);
    console.log(`  Stock Movements: includes opening + sale/purchase records`);
    console.log(`  Filing History: ${filings.length}`);
    console.log(`  Audit Logs:     ${auditLogs.length}`);
    console.log('========================================');
    console.log('\nLogin credentials:');
    console.log('  Email:    admin@calcutta.com');
    console.log('  Password: admin123');
    console.log('========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();

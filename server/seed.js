const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Company = require('./models/Company');
const Party = require('./models/Party');
const Product = require('./models/Product');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Dropping existing collections...');
    const collections = ['users', 'companies', 'parties', 'products'];
    for (const name of collections) {
      const coll = await mongoose.connection.db.listCollections({ name }).next();
      if (coll) {
        await mongoose.connection.db.dropCollection(name);
        console.log(`  Dropped collection: ${name}`);
      }
    }

    console.log('Creating admin user...');
    const user = await User.create({
      name: 'Admin',
      email: 'admin@calcutta.com',
      password: 'admin123',
      phone: '9876543210',
      role: 'admin'
    });
    console.log(`  Admin user created: ${user.email}`);

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
      mobile: '9876543210'
    });
    console.log(`  Company created: ${company.businessName}`);

    console.log('Creating sample parties...');
    const parties = await Party.insertMany([
      {
        userId: user._id,
        partyType: 'Customer',
        name: 'Rajesh Sharma',
        companyName: 'Sharma Traders',
        gstin: '19ABCDE1234F1Z5',
        mobile: '9832100001',
        email: 'rajesh@sharmatraders.com',
        address: '12, College Road',
        city: 'Kolkata',
        state: 'West Bengal',
        stateCode: 19,
        pincode: '700001',
        openingBalance: 0,
        creditLimit: 50000
      },
      {
        userId: user._id,
        partyType: 'Customer',
        name: 'Priya Das',
        companyName: 'Das Enterprises',
        gstin: '19FGHIJ5678K1Z5',
        mobile: '9832100002',
        email: 'priya@dasenterprises.com',
        address: '45, Lake Market',
        city: 'Kolkata',
        state: 'West Bengal',
        stateCode: 19,
        pincode: '700029',
        openingBalance: 2500,
        creditLimit: 30000
      },
      {
        userId: user._id,
        partyType: 'Supplier',
        name: 'Amit Singhania',
        companyName: 'Singhania Steel Works',
        gstin: '19KLMNO9012P1Z5',
        mobile: '9832100003',
        email: 'amit@singhaniasteel.com',
        address: '8, GT Road',
        city: 'Howrah',
        state: 'West Bengal',
        stateCode: 19,
        pincode: '711101',
        openingBalance: 0,
        creditLimit: 100000
      },
      {
        userId: user._id,
        partyType: 'Supplier',
        name: 'Sushmita Roy',
        companyName: 'Roy Packaging House',
        gstin: '19PQRST3456U1Z5',
        mobile: '9832100004',
        email: 'sushmita@roypackaging.com',
        address: '22, Station Road',
        city: 'Baidyabati',
        state: 'West Bengal',
        stateCode: 19,
        pincode: '712222',
        openingBalance: 12000,
        creditLimit: 75000
      },
      {
        userId: user._id,
        partyType: 'Customer',
        name: 'Vikram Ghosh',
        companyName: 'Ghosh Engineering Solutions',
        gstin: '19VWXYZ7890M1Z5',
        mobile: '9832100005',
        email: 'vikram@ghoshengineering.com',
        address: '33, B.T. Road',
        city: 'Kolkata',
        state: 'West Bengal',
        stateCode: 19,
        pincode: '700056',
        openingBalance: 0,
        creditLimit: 20000
      }
    ]);
    console.log(`  ${parties.length} parties created`);

    console.log('Creating sample products...');
    const products = await Product.insertMany([
      {
        userId: user._id,
        name: 'Industrial Bearing',
        description: 'Ball bearing 6205ZZ for heavy machinery',
        unit: 'Nos',
        hsnCode: '8482',
        taxRate: 18,
        sellingPrice: 450,
        purchasePrice: 320,
        openingStock: 150,
        lowStockAlert: 20,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'Steel Roller Chain',
        description: '16B-1 roller chain 10 ft length',
        unit: 'Nos',
        hsnCode: '7315',
        taxRate: 18,
        sellingPrice: 1200,
        purchasePrice: 850,
        openingStock: 80,
        lowStockAlert: 10,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'Hydraulic Oil',
        description: 'ISO VG 68 hydraulic oil - 20L can',
        unit: 'Ltrs',
        hsnCode: '2710',
        taxRate: 18,
        sellingPrice: 3200,
        purchasePrice: 2500,
        openingStock: 40,
        lowStockAlert: 5,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'High Tensile Bolt',
        description: 'M16 x 60mm high tensile bolt with nut',
        unit: 'Nos',
        hsnCode: '7318',
        taxRate: 18,
        sellingPrice: 15,
        purchasePrice: 8,
        openingStock: 2000,
        lowStockAlert: 200,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'Copper Wire',
        description: '1.5 sqmm single core copper wire (90m roll)',
        unit: 'Nos',
        hsnCode: '7408',
        taxRate: 18,
        sellingPrice: 1800,
        purchasePrice: 1350,
        openingStock: 60,
        lowStockAlert: 10,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'PVC Insulation Tape',
        description: 'Electrical grade PVC tape 18mm x 20m',
        unit: 'Pcs',
        hsnCode: '3919',
        taxRate: 18,
        sellingPrice: 45,
        purchasePrice: 28,
        openingStock: 500,
        lowStockAlert: 50,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'Welding Electrode',
        description: 'E6013 mild steel welding electrode 3.15mm',
        unit: 'Kgs',
        hsnCode: '8311',
        taxRate: 18,
        sellingPrice: 110,
        purchasePrice: 75,
        openingStock: 300,
        lowStockAlert: 30,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'Rubber Gasket Sheet',
        description: '3mm industrial rubber gasket sheet 1m x 1m',
        unit: 'Nos',
        hsnCode: '4016',
        taxRate: 18,
        sellingPrice: 650,
        purchasePrice: 420,
        openingStock: 100,
        lowStockAlert: 15,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'Cutting Oil',
        description: 'Soluble cutting oil 5L bottle',
        unit: 'Ltrs',
        hsnCode: '3403',
        taxRate: 18,
        sellingPrice: 850,
        purchasePrice: 580,
        openingStock: 75,
        lowStockAlert: 10,
        gstType: 'gst'
      },
      {
        userId: user._id,
        name: 'Compressor Belt',
        description: 'A-38 V-belt for air compressor',
        unit: 'Nos',
        hsnCode: '4010',
        taxRate: 18,
        sellingPrice: 280,
        purchasePrice: 180,
        openingStock: 120,
        lowStockAlert: 20,
        gstType: 'gst'
      }
    ]);
    console.log(`  ${products.length} products created`);

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();

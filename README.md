# Calcutta Machinery Billing Software

> A full-featured GST billing and business management system for Indian businesses. Built with the MERN stack — generates tax invoices, manages parties/products, handles GST compliance (GSTR-1/GSTR-3B), tracks inventory, expenses, labour, attendance, and staff — all in one platform.

[![Node](https://img.shields.io/badge/node-18%2B-brightgreen)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-green)](https://mongodb.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)

---

## Screenshots

<!-- Add screenshots here -->
<!-- ![Dashboard](./screenshots/dashboard.png) -->
<!-- ![Invoice](./screenshots/invoice.png) -->
<!-- ![Reports](./screenshots/reports.png) -->

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, React Router v6, Axios, Papaparse |
| **Backend** | Node.js, Express 4, Mongoose 8, JWT, bcryptjs |
| **Database** | MongoDB |
| **Invoice Engine** | 16 print/PDF templates (classic, modern, tally, thermal, A5, boutique, government, international, e-commerce, corporate, elegant, vibrant, compact, retail, professional, classic-b2c) |
| **Barcode** | bwip-js |
| **Auth** | JWT + Google OAuth |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## Features — Complete Breakdown

### Invoicing
- **8 invoice types** — Tax Invoice, Bill of Supply, Credit Note, Debit Note, Proforma Invoice, Quotation, Delivery Challan, Purchase Order
- **Auto invoice numbering** with configurable prefix per company
- **16 invoice templates** with full customization (colors, fonts, sections)
- **CGST/SGST/IGST** auto-calculation based on place of supply (inter-state vs intra-state)
- **Amount-in-words** in Indian numbering system (lakh/crore/paise)
- **Company logo, signature, bank details, UPI QR code** on invoices
- **Transport/e-way bill fields**
- **Print & PDF** support via `window.print()` and `InvoiceTemplate` component

### Party Management
- Customers & Suppliers with GSTIN validation
- Separate billing & shipping addresses
- Credit limit tracking, opening balance
- State-wise GST code mapping (38 states/UTs)
- Party grouping (General, etc.)

### Product Management
- HSN/SAC codes for GST
- Tax rates: 0%, 3%, 5%, 12%, 18%, 28%
- CESS support
- Selling & purchase price tracking
- Stock quantity with low-stock alerts
- Barcode generation for each product

### GST Compliance
- **GSTR-1** — Monthly outward supply summary
- **GSTR-3B** — Summary return with tax liability
- **Auto tax calculation** — CGST+SGST (intra-state) or IGST (inter-state) based on party state code vs company state code
- **E-invoicing IRN** field support

### Reports & Analytics
- Sales Report
- Purchase Report
- Profit & Loss Statement
- Outstanding Receivables
- Purchase Register
- Analytics Dashboard with charts
- Tally Export (Tally-compatible format)

### Inventory
- Stock movements log
- Opening stock tracking
- Low-stock threshold alerts
- Product-wise stock view

### Expenses
- Add/edit/delete business expenses
- Expense categorization
- Date-wise expense tracking

### Labour & Attendance
- **Labour Management** — Add/edit/delete labour records
- **Attendance Tracking** — Daily attendance logs with edit/delete

### Staff & Access Control
- Multi-user staff accounts
- Staff invite system
- Role-based access

### Audit Trail
- Full activity logging for every action (create, update, delete) on invoices, parties, products, expenses
- Tamper-evident audit log view

### Utility Features
- **Barcode Generator** — Generate printable barcodes for any product
- **Keyboard Shortcuts** — F1 (help), F2 (new invoice), F3 (parties), F4 (products), F5 (invoices), Ctrl+I/N (new invoice), Ctrl+D (dashboard), Ctrl+P (parties), Ctrl+B (products), Ctrl+S (all invoices)
- **Payment Tracking** — Paid/Unpaid/Partial status with payment method tracking

---

## Database Models (13 MongoDB Collections)

| Model | Key Fields |
|-------|-----------|
| **User** | name, email, password, phone, googleId |
| **Company** | businessName, GSTIN, PAN, address, bank details, UPI, logo, invoicePrefix, templateSettings, stateCode |
| **Party** | partyType (Customer/Supplier), name, companyName, GSTIN, mobile, address, stateCode, openingBalance, creditLimit |
| **Product** | name, unit, HSN code, taxRate, cess, sellingPrice, purchasePrice, openingStock, lowStockAlert |
| **Invoice** | invoiceNo, invoiceDate, dueDate, party, company, items (embedded), subtotal, tax totals, grandTotal, roundOff, amountInWords, paymentStatus, invoiceType |
| **Payment** | invoice, party, amount, method, date, reference |
| **Expense** | description, amount, category, date, party |
| **StockMovement** | product, type (in/out), quantity, date, invoice reference |
| **Labour** | name, phone, wageRate, address |
| **Attendance** | labour, date, hours, wageAmount, status |
| **AuditLog** | user, action, resource, resourceId, changes, ip |
| **StaffInvite** | email, company, role, status, token |
| **FilingHistory** | returnType, period, status, filedDate |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user profile |

### Company
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/company` | Create company profile |
| GET | `/api/company` | Get company profile |
| PUT | `/api/company/:id` | Update company profile |

### Parties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parties` | List all parties |
| POST | `/api/parties` | Create party |
| GET | `/api/parties/:id` | Get party by ID |
| PUT | `/api/parties/:id` | Update party |
| DELETE | `/api/parties/:id` | Delete party |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product by ID |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices (with filters) |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice by ID |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| PATCH | `/api/invoices/:id/payment` | Update payment status |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/sales` | Sales report |
| GET | `/api/reports/purchases` | Purchase report |
| GET | `/api/reports/gstr1` | GSTR-1 report |
| GET | `/api/reports/gstr3b` | GSTR-3B report |
| GET | `/api/reports/outstanding` | Outstanding report |
| GET | `/api/reports/profit-loss` | P&L statement |
| GET | `/api/reports/purchase-register` | Purchase register |

### GST
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gst/returns` | GST return history |
| POST | `/api/gst/returns` | File GST return |
| GET | `/api/gstin/validate` | Validate GSTIN |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Inventory & Barcode
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get inventory stock |
| POST | `/api/barcode` | Generate barcode |

### Staff, Labour & Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/api/staff` | Staff account management |
| CRUD | `/api/labour` | Labour management |
| CRUD | `/api/attendance` | Attendance management |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit` | Get audit trail logs |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## Project Structure

```
├── client/                          # React frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── Layout.js            # Shell (Navbar + Sidebar + content)
│   │   │   ├── Sidebar.js           # Navigation sidebar
│   │   │   ├── Navbar.js            # Top navigation bar
│   │   │   ├── ProtectedRoute.js    # Auth guard
│   │   │   ├── Loading.js           # Loading spinner
│   │   │   └── InvoiceTemplate.js   # 16-theme invoice template engine
│   │   ├── context/
│   │   │   ├── AuthContext.js       # JWT auth state (login/logout/session)
│   │   │   └── CompanyContext.js    # Company profile state
│   │   ├── hooks/
│   │   │   └── useKeyboardShortcuts.js
│   │   ├── pages/                   # 36 page components
│   │   │   ├── Dashboard
│   │   │   ├── LoginPage / RegisterPage
│   │   │   ├── PartyList / PartyForm
│   │   │   ├── ProductList / ProductForm
│   │   │   ├── InvoiceList / InvoiceCreate / InvoiceView / InvoiceEdit
│   │   │   ├── SalesReport / PurchaseReport / GSTR1Report / GSTR3BReport
│   │   │   ├── OutstandingReport / ProfitLossReport / PurchaseRegister
│   │   │   ├── ExpenseList / ExpenseForm
│   │   │   ├── PaymentList
│   │   │   ├── CompanySetup / Settings / TemplateSettings
│   │   │   ├── GSTReturns
│   │   │   ├── StaffManagement
│   │   │   ├── AuditTrail
│   │   │   ├── Analytics
│   │   │   ├── Inventory
│   │   │   ├── BarcodeGenerator
│   │   │   ├── TallyExport
│   │   │   ├── LabourList / LabourForm
│   │   │   ├── AttendanceList / AttendanceForm
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── api.js               # Axios instance with JWT interceptor
│   │   │   └── helpers.js           # INR formatting, amount-in-words, tax calc, constants
│   │   ├── App.js                   # Route definitions
│   │   └── index.js                 # Entry point
│   ├── .env / .env.production
│   ├── vercel.json
│   └── package.json
├── server/                          # Express backend
│   ├── middleware/                   # JWT protect middleware
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Party.js
│   │   ├── Product.js
│   │   ├── Invoice.js
│   │   ├── Payment.js
│   │   ├── Expense.js
│   │   ├── StockMovement.js
│   │   ├── Labour.js
│   │   ├── Attendance.js
│   │   ├── AuditLog.js
│   │   ├── StaffInvite.js
│   │   └── FilingHistory.js
│   ├── routes/                      # Express route handlers
│   │   ├── auth.js
│   │   ├── company.js
│   │   ├── party.js
│   │   ├── product.js
│   │   ├── invoice.js
│   │   ├── reports.js
│   │   ├── expenses.js
│   │   ├── inventory.js
│   │   ├── barcode.js
│   │   ├── gstin.js
│   │   ├── gstReturns.js
│   │   ├── staff.js
│   │   ├── labour.js
│   │   ├── attendance.js
│   │   └── audit.js
│   ├── utils/
│   │   ├── amountInWords.js
│   │   └── constants.js
│   ├── seed.js / seed-full.js       # Database seed scripts
│   ├── server.js                    # Entry point
│   └── package.json
├── .env.example
├── package.json                     # Root (concurrently runs server + client)
├── render.yaml                      # Render deployment config
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/danishkagit/calcuttamachinery-billing.git
   cd calcuttamachinery-billing
   ```

2. **Configure environment variables**
   ```bash
   # Server
   cd server
   copy .env.example .env        # Windows
   # cp .env.example .env        # Linux/Mac
   # Edit .env with your MongoDB URI and JWT secret

   # Client
   cd ../client
   copy .env.example .env        # if exists, otherwise create:
   # REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Install dependencies & run**
   ```bash
   # From root — runs both server and client concurrently
   npm install
   npm run dev
   ```
   Or run separately:
   ```bash
   # Terminal 1 — Server (port 5000)
   cd server && npm install && npm run dev

   # Terminal 2 — Client (port 3000)
   cd client && npm install && npm start
   ```

4. **Open** http://localhost:3000

### Seed Database with Demo Data
```bash
cd server
node seed.js          # Basic data (admin user, sample products, parties)
node seed-full.js     # Full demo data (50+ invoices, transactions)
```

### Environment Variables

**Server (`server/.env`)**
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/gstbilling` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRE` | Token lifetime | `30d` |
| `CLIENT_URL` | CORS allowed origin | `http://localhost:3000` |

**Client (`client/.env`)**
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## Deployment

### Backend — Render
The `render.yaml` file configures a free-tier Node service. Connect the repo, set `MONGODB_URI` (Atlas), `JWT_SECRET`, and `CLIENT_URL` as environment secrets in the Render dashboard.

### Frontend — Vercel
The `client/vercel.json` handles SPA routing. In Vercel, set `REACT_APP_API_URL` to your Render backend URL.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F1` | Show keyboard shortcuts help |
| `F2` | New Invoice |
| `F3` | Parties |
| `F4` | Products |
| `F5` | All Invoices |
| `Ctrl + I` / `Ctrl + N` | New Invoice |
| `Ctrl + D` | Dashboard |
| `Ctrl + P` | Parties |
| `Ctrl + B` | Products |
| `Ctrl + S` | All Invoices |
| `Escape` | Close help overlay |

---

## Invoice Template Themes

| Template | Best For |
|----------|----------|
| `classic` | General business |
| `modern` | Contemporary look |
| `professional` | Corporate |
| `elegant` | Premium branding |
| `corporate` | Large enterprises |
| `retail` | Retail shops |
| `tally` | Tally ERP users (familiar layout) |
| `vibrant` | Colorful branding |
| `classic-b2c` | B2C transactions |
| `government` | Govt. supply invoices |
| `international` | Export invoices |
| `e-commerce` | Online orders |
| `compact` | Space-saving layout |
| `boutique` | Small business / boutique |
| `thermal` | Thermal printer optimized |
| `a5` | A5 paper size |

Each template supports customization of: header background/color, font family, accent color, sections visibility (bank details, signature, transport info, terms).

---

## License

Private — All rights reserved.

---

## Author

[Danishka Git](https://github.com/danishkagit)
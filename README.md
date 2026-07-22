# Calcutta Machinery Billing Software

A GST billing system for Calcutta Machinery.

## Features
- Generate Tax Invoices
- Manage Parties and Products
- GST Reports (GSTR1, GSTR3B, Sales, Purchase)
- Manual Payment Tracking

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB

### Setup

1. Start MongoDB locally.
2. In the `server` directory, create a `.env` file:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/gstbilling
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   ```
3. Run `npm install` and `npm run dev` in the `server` directory.
4. In the `client` directory, run `npm install` and `npm start`.

## Deployment
This project is configured for deployment on Railway (see `railway.json` and `railway.toml` if available, or just connect the repo to Railway).

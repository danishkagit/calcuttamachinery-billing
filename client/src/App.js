import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CompanySetup from './pages/CompanySetup';
import PartyList from './pages/PartyList';
import PartyForm from './pages/PartyForm';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import InvoiceList from './pages/InvoiceList';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceView from './pages/InvoiceView';
import InvoiceEdit from './pages/InvoiceEdit';
import SalesReport from './pages/SalesReport';
import PurchaseReport from './pages/PurchaseReport';
import GSTR1Report from './pages/GSTR1Report';
import GSTR3BReport from './pages/GSTR3BReport';
import OutstandingReport from './pages/OutstandingReport';
import PaymentList from './pages/PaymentList';
import GSTReturns from './pages/GSTReturns';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/company" element={<Layout><CompanySetup /></Layout>} />
          <Route path="/parties" element={<Layout><PartyList /></Layout>} />
          <Route path="/parties/add" element={<Layout><PartyForm /></Layout>} />
          <Route path="/parties/edit/:id" element={<Layout><PartyForm /></Layout>} />
          <Route path="/products" element={<Layout><ProductList /></Layout>} />
          <Route path="/products/add" element={<Layout><ProductForm /></Layout>} />
          <Route path="/products/edit/:id" element={<Layout><ProductForm /></Layout>} />
          <Route path="/invoices" element={<Layout><InvoiceList /></Layout>} />
          <Route path="/invoices/create" element={<Layout><InvoiceCreate /></Layout>} />
          <Route path="/invoices/:id" element={<Layout><InvoiceView /></Layout>} />
          <Route path="/invoices/edit/:id" element={<Layout><InvoiceEdit /></Layout>} />
          <Route path="/reports/sales" element={<Layout><SalesReport /></Layout>} />
          <Route path="/reports/purchases" element={<Layout><PurchaseReport /></Layout>} />
          <Route path="/reports/gstr1" element={<Layout><GSTR1Report /></Layout>} />
          <Route path="/reports/gstr3b" element={<Layout><GSTR3BReport /></Layout>} />
          <Route path="/reports/outstanding" element={<Layout><OutstandingReport /></Layout>} />
          <Route path="/payments" element={<Layout><PaymentList /></Layout>} />
          <Route path="/gst-returns" element={<Layout><GSTReturns /></Layout>} />
        </Routes>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;

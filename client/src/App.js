import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';
  return (
    <GoogleOAuthProvider clientId={clientId}>
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
          theme="dark"
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/company" element={<ProtectedLayout><CompanySetup /></ProtectedLayout>} />
          <Route path="/parties" element={<ProtectedLayout><PartyList /></ProtectedLayout>} />
          <Route path="/parties/add" element={<ProtectedLayout><PartyForm /></ProtectedLayout>} />
          <Route path="/parties/edit/:id" element={<ProtectedLayout><PartyForm /></ProtectedLayout>} />
          <Route path="/products" element={<ProtectedLayout><ProductList /></ProtectedLayout>} />
          <Route path="/products/add" element={<ProtectedLayout><ProductForm /></ProtectedLayout>} />
          <Route path="/products/edit/:id" element={<ProtectedLayout><ProductForm /></ProtectedLayout>} />
          <Route path="/invoices" element={<ProtectedLayout><InvoiceList /></ProtectedLayout>} />
          <Route path="/invoices/create" element={<ProtectedLayout><InvoiceCreate /></ProtectedLayout>} />
          <Route path="/invoices/:id" element={<ProtectedLayout><InvoiceView /></ProtectedLayout>} />
          <Route path="/invoices/edit/:id" element={<ProtectedLayout><InvoiceEdit /></ProtectedLayout>} />
          <Route path="/reports/sales" element={<ProtectedLayout><SalesReport /></ProtectedLayout>} />
          <Route path="/reports/purchases" element={<ProtectedLayout><PurchaseReport /></ProtectedLayout>} />
          <Route path="/reports/gstr1" element={<ProtectedLayout><GSTR1Report /></ProtectedLayout>} />
          <Route path="/reports/gstr3b" element={<ProtectedLayout><GSTR3BReport /></ProtectedLayout>} />
          <Route path="/reports/outstanding" element={<ProtectedLayout><OutstandingReport /></ProtectedLayout>} />
          <Route path="/payments" element={<ProtectedLayout><PaymentList /></ProtectedLayout>} />
          <Route path="/gst-returns" element={<ProtectedLayout><GSTReturns /></ProtectedLayout>} />
        </Routes>
        </CompanyProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

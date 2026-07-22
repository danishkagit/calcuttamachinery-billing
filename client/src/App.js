import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
import TemplateSettings from './pages/TemplateSettings';
import ExpenseList from './pages/ExpenseList';
import ExpenseForm from './pages/ExpenseForm';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import StaffManagement from './pages/StaffManagement';
import AuditTrail from './pages/AuditTrail';
import ProfitLossReport from './pages/ProfitLossReport';
import PurchaseRegister from './pages/PurchaseRegister';
import Inventory from './pages/Inventory';
import BarcodeGenerator from './pages/BarcodeGenerator';
import TallyExport from './pages/TallyExport';

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
      <AuthProvider>
        <CompanyProvider>
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
          <Route path="/settings/templates" element={<ProtectedLayout><TemplateSettings /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="/expenses" element={<ProtectedLayout><ExpenseList /></ProtectedLayout>} />
          <Route path="/expenses/add" element={<ProtectedLayout><ExpenseForm /></ProtectedLayout>} />
          <Route path="/expenses/edit/:id" element={<ProtectedLayout><ExpenseForm /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
          <Route path="/staff" element={<ProtectedLayout><StaffManagement /></ProtectedLayout>} />
          <Route path="/audit-trail" element={<ProtectedLayout><AuditTrail /></ProtectedLayout>} />
          <Route path="/profit-loss" element={<ProtectedLayout><ProfitLossReport /></ProtectedLayout>} />
          <Route path="/purchase-register" element={<ProtectedLayout><PurchaseRegister /></ProtectedLayout>} />
          <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
          <Route path="/barcodes" element={<ProtectedLayout><BarcodeGenerator /></ProtectedLayout>} />
          <Route path="/tally-export" element={<ProtectedLayout><TallyExport /></ProtectedLayout>} />
        </Routes>
        </CompanyProvider>
      </AuthProvider>
  );
}

export default App;

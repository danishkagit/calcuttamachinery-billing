import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input, textarea, or select
      if (['input', 'textarea', 'select'].includes(e.target.tagName.toLowerCase())) {
        return;
      }
      
      if (e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            navigate('/invoices/create');
            break;
          case 'a':
            e.preventDefault();
            navigate('/');
            break;
          case 'p':
            e.preventDefault();
            navigate('/products/add');
            break;
          case 's':
            e.preventDefault();
            // Map service to products add since they might share the same master, or just add a separate text
            navigate('/products/add');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="app-layout">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="app-body d-flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="main-content flex-grow-1" style={{ position: 'relative' }}>
          <div className="container-fluid p-4">
            {children}
          </div>
          
          {/* Floating Shortcuts Help Text */}
          <div className="shortcuts-help d-none d-md-block" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            fontSize: '0.85rem',
            color: '#475569',
            zIndex: 1000,
            lineHeight: '1.6'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              <i className="fas fa-keyboard me-2"></i>Keyboard Shortcuts
            </div>
            <div><kbd style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>Alt + B</kbd> <span className="ms-2">New Billing</span></div>
            <div><kbd style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>Alt + A</kbd> <span className="ms-2">Analysis / Dashboard</span></div>
            <div><kbd style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>Alt + P</kbd> <span className="ms-2">Add Product</span></div>
            <div><kbd style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>Alt + S</kbd> <span className="ms-2">Add Service</span></div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

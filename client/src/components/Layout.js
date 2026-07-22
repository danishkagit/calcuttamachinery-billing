import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const shortcuts = [
  { key: 'F1', action: 'Toggle this help' },
  { key: 'F2', action: 'New Invoice' },
  { key: 'F3', action: 'Parties' },
  { key: 'F4', action: 'Products' },
  { key: 'F5', action: 'All Invoices' },
  { key: 'Ctrl+I / N', action: 'New Invoice' },
  { key: 'Ctrl+D', action: 'Dashboard' },
  { key: 'Ctrl+P', action: 'Parties' },
  { key: 'Ctrl+B', action: 'Products' },
  { key: 'Ctrl+S', action: 'All Invoices' },
  { key: 'Esc', action: 'Close help' },
];

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { showHelp, closeHelp } = useKeyboardShortcuts(navigate);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="app-body d-flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-4">
            {children}
          </div>
        </main>
      </div>

      {showHelp && (
        <div className="shortcut-overlay" onClick={closeHelp}>
          <div className="shortcut-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcut-modal-header">
              <h6 className="fw-semibold mb-0">Keyboard Shortcuts</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={closeHelp}>&times;</button>
            </div>
            <div className="shortcut-modal-body">
              {shortcuts.map((s) => (
                <div key={s.key} className="shortcut-row">
                  <kbd>{s.key}</kbd>
                  <span>{s.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
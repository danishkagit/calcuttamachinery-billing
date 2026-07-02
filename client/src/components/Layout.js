import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    </div>
  );
};

export default Layout;

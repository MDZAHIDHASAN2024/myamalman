import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const BASE_NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/amal-post', icon: '✏️', label: 'Post' },
  { to: '/amal-view', icon: '📋', label: 'View' },
  { to: '/analytics', icon: '📊', label: 'Stats' },
  { to: '/tips-sunnah', icon: '💡', label: 'Tips' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems =
    user?.role === 'admin'
      ? [...BASE_NAV, { to: '/admin', icon: '🛡️', label: 'Admin' }]
      : BASE_NAV;

  const totalCols = navItems.length + 1; // +1 for logout

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <div className="page-content fade-in">{children}</div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className={`bottom-nav${sidebarOpen ? ' bnav-hidden' : ''}`}>
        <div
          className="bottom-nav-items"
          style={{
            gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
            display: 'grid',
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `bottom-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="bnav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            className="bottom-nav-item bnav-logout"
            onClick={handleLogout}
          >
            <span className="bnav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

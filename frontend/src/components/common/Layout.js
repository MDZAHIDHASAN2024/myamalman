import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

const BOTTOM_NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/amal-post', icon: '✏️', label: 'Post' },
  { to: '/amal-view', icon: '📋', label: 'View' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <div className="page-content fade-in">
          {children}
        </div>
      </div>
      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          {BOTTOM_NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
              <span className="bnav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
              <span className="bnav-icon">🛡️</span>
              <span>Admin</span>
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/amal-post', icon: '✏️', label: 'Amal Post' },
  { to: '/amal-view', icon: '📋', label: 'Amal View' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:199,backdropFilter:'blur(2px)' }} />
      )}
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:42,height:42,borderRadius:12,background:'var(--accent-grad)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>☪️</div>
            <div>
              <div style={{ fontWeight:800,fontSize:17,color:'var(--accent)',letterSpacing:'-0.3px' }}>My Amal</div>
              <div style={{ fontSize:10,color:'var(--text-muted)',fontWeight:500 }}>আমার আমল ট্র্যাকার</div>
            </div>
          </div>
          {user && (
            <div style={{ marginTop:14,padding:'10px 12px',background:'var(--bg-tertiary)',borderRadius:10,border:'1px solid var(--border)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:32,height:32,borderRadius:8,background:'var(--accent-grad)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:800,fontSize:13,flexShrink:0 }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow:'hidden',flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize:10,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.email}</div>
                </div>
              </div>
              {user.role === 'admin' && (
                <div style={{ marginTop:6 }}>
                  <span className="badge badge-warning" style={{ fontSize:9 }}>👑 ADMIN</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1,padding:'10px 0',overflowY:'auto' }}>
          <div style={{ padding:'6px 16px 4px',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px' }}>Menu</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onClose}>
              <span className="nav-emoji">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div style={{ padding:'10px 16px 4px',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginTop:4 }}>Admin</div>
              <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <span className="nav-emoji">🛡️</span>
                <span>Admin Panel</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'12px 8px',borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:2 }}>
          <button className="nav-item" onClick={toggleTheme}>
            <span className="nav-emoji">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="nav-item" onClick={() => { logout(); navigate('/login'); }}
            style={{ color:'var(--danger)' }}>
            <span className="nav-emoji">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

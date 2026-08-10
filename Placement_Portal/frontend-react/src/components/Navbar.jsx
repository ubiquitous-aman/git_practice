/**
 * src/components/Navbar.jsx
 *
 * Glassmorphic navigation header component.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, Building2, Briefcase } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="glass-panel" style={{ margin: '16px 24px', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--primary-glow)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
          <GraduationCap size={24} color="#818cf8" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            CampusPlacement<span style={{ color: 'var(--accent-cyan)' }}>Portal</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {user.role === 'student' ? 'Student Workspace' : 'Placement Cell (TPO)'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.role === 'student' ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{user.name}</span>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
            {user.role}
          </span>
        </div>

        <button onClick={logout} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

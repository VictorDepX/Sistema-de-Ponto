import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const NAV = [
  { to: '/ponto',           label: 'Ponto',     icon: ClockIcon  },
  { to: '/ponto/historico', label: 'Histórico', icon: ListIcon   },
  { to: '/ponto/perfil',    label: 'Perfil',    icon: PersonIcon },
];

export default function EmployeeLayout() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', background: 'var(--bg)',
      maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </div>
      <nav style={{
        display: 'flex', background: 'var(--bg1)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/ponto'} style={{ flex: 1 }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '10px 0',
                color: isActive ? 'var(--accent)' : 'var(--text3)',
                transition: 'color 0.15s',
              }}>
                <Icon size={22} />
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function ClockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function ListIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}
function PersonIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

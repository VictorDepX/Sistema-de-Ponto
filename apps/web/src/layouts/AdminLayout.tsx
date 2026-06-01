import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const NAV = [
  { to: '/admin',               label: 'Dashboard',    icon: '◈', end: true },
  { to: '/admin/funcionarios',  label: 'Funcionários', icon: '◎' },
  { to: '/admin/relatorios',    label: 'Relatórios',   icon: '▤' },
  { to: '/admin/auditoria',     label: 'Auditoria',    icon: '◷' },
  { to: '/admin/qrcode',        label: 'QR Code',      icon: '▦' },
];

export default function AdminLayout() {
  const user    = useAuthStore(s => s.user);
  const logout  = useAuthStore(s => s.logout);
  const nav     = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => { await logout(); nav('/login'); };

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 60 : 220, flexShrink: 0,
        background: 'var(--bg1)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)', letterSpacing: 3 }}>PONTO</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginTop: 1 }}>ADMIN</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ color: 'var(--text3)', padding: 4, fontSize: 14 }}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 10, padding: '10px 12px', borderRadius: 'var(--r)',
                  background:  isActive ? 'var(--accent-l)' : 'transparent',
                  color:       isActive ? 'var(--accent)' : 'var(--text2)',
                  borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all 0.15s',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  {!collapsed && label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: collapsed ? '16px 8px' : '16px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px',
              background: 'var(--red-l)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--r-sm)', color: 'var(--red)',
              fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start', gap: 6,
            }}
          >
            <span>↩</span>
            {!collapsed && 'Sair'}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}

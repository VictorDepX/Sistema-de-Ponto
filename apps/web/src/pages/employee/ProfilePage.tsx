import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useNavigate }  from 'react-router-dom';

export default function ProfilePage() {
  const user   = useAuthStore(s => s.user!);
  const logout = useAuthStore(s => s.logout);
  const nav    = useNavigate();

  const handleLogout = async () => { await logout(); nav('/login'); };

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2, marginBottom: 24 }}>
        PERFIL
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {user.name[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{user.email}</div>
          <div style={{
            marginTop: 6, display: 'inline-block',
            padding: '3px 10px', borderRadius: 6,
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: 1,
            background: 'var(--accent-l)', color: 'var(--accent)',
            border: '1px solid rgba(255,107,0,0.2)',
          }}>
            {user.role}
          </div>
        </div>
      </div>

      {[
        { label: 'E-mail',   val: user.email },
        { label: 'Perfil',   val: user.role },
        { label: 'Cadastro', val: user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—' },
      ].map(item => (
        <div key={item.label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 0', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{item.label}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{item.val}</span>
        </div>
      ))}

      <div style={{
        marginTop: 28, padding: '14px 16px',
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>💡 Instalar como app</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          <strong style={{ color: 'var(--text2)' }}>iPhone:</strong> Safari → Compartilhar → Adicionar à Tela de Início
          <br />
          <strong style={{ color: 'var(--text2)' }}>Android:</strong> Chrome → ⋮ → Instalar app
        </div>
      </div>

      <button onClick={handleLogout} style={{
        width: '100%', marginTop: 24, padding: '15px',
        background: 'var(--red-l)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 'var(--r)', color: 'var(--red)',
        fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, letterSpacing: 1,
      }}>
        ↩ SAIR
      </button>
    </div>
  );
}

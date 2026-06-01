import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Role } from '@ponto/types';

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', padding: '13px 14px',
  color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
};

export default function LoginPage() {
  const [email,    setEmail]   = useState('');
  const [password, setPass]    = useState('');
  const [error,    setError]   = useState('');
  const [loading,  setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const nav   = useNavigate();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Preencha e-mail e senha.'); return; }
    setError(''); setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      const user = useAuthStore.getState().user;
      nav(user?.role === Role.ADMIN ? '/admin' : '/ponto', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? (err as any).response?.data?.message ?? err.message
          : 'Credenciais inválidas.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px 20px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }} className="fade-in">
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 40px rgba(255,107,0,0.3)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, letterSpacing: 3, color: 'var(--text)' }}>
          PONTO
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, letterSpacing: 1 }}>
          SISTEMA DE PONTO ELETRÔNICO
        </div>
      </div>

      <form onSubmit={handle} style={{ width: '100%', maxWidth: 360 }} className="fade-in">
        <div style={{
          background: 'var(--bg1)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: 28,
        }}>
          {error && (
            <div style={{
              background: 'var(--red-l)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--r)', padding: '10px 14px',
              color: 'var(--red)', fontSize: 13, marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 8, fontFamily: 'var(--mono)' }}>
            E-MAIL
          </label>
          <input
            style={inp} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email" autoCapitalize="none"
          />

          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 8, marginTop: 16, fontFamily: 'var(--mono)' }}>
            SENHA
          </label>
          <input
            style={inp} type="password" value={password}
            onChange={e => setPass(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', marginTop: 24, padding: '15px',
              background: loading ? 'var(--bg3)' : 'var(--accent)',
              border: 'none', borderRadius: 'var(--r)',
              color: '#fff', fontFamily: 'var(--mono)',
              fontSize: 13, fontWeight: 600, letterSpacing: 1,
              transition: 'background 0.15s',
            }}
          >
            {loading ? '...' : 'ENTRAR'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 20 }}>
          Demo: admin@academia.com / admin123
        </p>
      </form>
    </div>
  );
}

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { Role } from '@ponto/types';

import LoginPage        from './pages/auth/LoginPage';
import PunchPage        from './pages/employee/PunchPage';
import HistoryPage      from './pages/employee/HistoryPage';
import ProfilePage      from './pages/employee/ProfilePage';
import DashboardPage    from './pages/admin/DashboardPage';
import EmployeesPage    from './pages/admin/EmployeesPage';
import ReportsPage      from './pages/admin/ReportsPage';
import AuditPage        from './pages/admin/AuditPage';
import QRPage           from './pages/admin/QRPage';
import EmployeeLayout   from './layouts/EmployeeLayout';
import AdminLayout      from './layouts/AdminLayout';

function Spinner() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0a0a0f',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid #2a2a35', borderTopColor: '#ff6b00',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (user?.role !== Role.ADMIN) return <Navigate to="/ponto" replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const { user, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return <Navigate to={user.role === Role.ADMIN ? '/admin' : '/ponto'} replace />;
}

export default function App() {
  const restore = useAuthStore(s => s.restore);
  useEffect(() => { restore(); }, [restore]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/"      element={<RoleRedirect />} />

      {/* Employee */}
      <Route
        path="/ponto"
        element={<RequireAuth><EmployeeLayout /></RequireAuth>}
      >
        <Route index              element={<PunchPage />} />
        <Route path="historico"   element={<HistoryPage />} />
        <Route path="perfil"      element={<ProfilePage />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </RequireAuth>
        }
      >
        <Route index                element={<DashboardPage />} />
        <Route path="funcionarios"  element={<EmployeesPage />} />
        <Route path="relatorios"    element={<ReportsPage />} />
        <Route path="auditoria"     element={<AuditPage />} />
        <Route path="qrcode"        element={<QRPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

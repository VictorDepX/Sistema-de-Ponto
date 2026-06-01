import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi, schedulesApi } from '../../services/api';
import { Role } from '@ponto/types';

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', padding: '11px 13px', color: 'var(--text)',
  fontSize: 14, boxSizing: 'border-box', outline: 'none',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontFamily: 'var(--mono)',
  color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 7,
};

function Btn({ children, onClick, color, style }: {
  children: React.ReactNode; onClick?: () => void; color?: string; style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 18px', borderRadius: 'var(--r)',
      background: color ?? 'var(--bg2)',
      border: `1px solid ${color ? 'transparent' : 'var(--border)'}`,
      color: color ? '#fff' : 'var(--text2)',
      fontSize: 13, fontWeight: 600, ...style,
    }}>{children}</button>
  );
}

type Modal = 'create' | 'edit' | 'schedule' | null;

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [modal,   setModal]  = useState<Modal>(null);
  const [selEmp,  setSelEmp] = useState<any>(null);
  const [form,    setForm]   = useState({ name: '', email: '', password: '', role: Role.EMPLOYEE });
  const [sched,   setSched]  = useState({ expectedStart: '08:00', expectedEnd: '17:00', breakMinutes: 60, weekdays: [1,2,3,4,5] });
  const [error,   setError]  = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'], queryFn: employeesApi.list,
  });

  const createMut = useMutation({
    mutationFn: employeesApi.create,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal(null); },
    onError:    (e: any) => setError(e.response?.data?.message ?? 'Erro'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: object }) => employeesApi.update(id, dto),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal(null); },
    onError:    (e: any) => setError(e.response?.data?.message ?? 'Erro'),
  });
  const deactivateMut = useMutation({
    mutationFn: employeesApi.deactivate,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
  const schedMut = useMutation({
    mutationFn: schedulesApi.create,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal(null); },
  });

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: Role.EMPLOYEE });
    setError(''); setModal('create');
  };
  const openEdit = (emp: any) => {
    setSelEmp(emp);
    setForm({ name: emp.name, email: emp.email, password: '', role: emp.role });
    setError(''); setModal('edit');
  };
  const openSched = (emp: any) => { setSelEmp(emp); setModal('schedule'); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'create') createMut.mutate(form);
    else if (modal === 'edit') updateMut.mutate({ id: selEmp.id, dto: { name: form.name, email: form.email } });
    else if (modal === 'schedule') schedMut.mutate({ ...sched, employeeId: selEmp.id });
  };

  const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const toggleDay = (d: number) =>
    setSched(s => ({
      ...s,
      weekdays: s.weekdays.includes(d)
        ? s.weekdays.filter(x => x !== d)
        : [...s.weekdays, d].sort((a,b)=>a-b),
    }));

  const thS: React.CSSProperties = { padding: '11px 16px', textAlign: 'left', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1, fontWeight: 600 };
  const tdS: React.CSSProperties = { padding: '13px 16px', fontSize: 13 };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2 }}>GESTÃO</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>Funcionários</h1>
        </div>
        <Btn color="var(--accent)" onClick={openCreate}>+ Novo</Btn>
      </div>

      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Funcionário','E-mail','Perfil','Status','Ações'].map(h => <th key={h} style={thS}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Carregando...</td></tr>}
            {(employees as any[]).map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--bg2)' }}>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-l)', border: '1px solid rgba(255,107,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                      {emp.name[0]}
                    </div>
                    <span style={{ fontWeight: 500 }}>{emp.name}</span>
                  </div>
                </td>
                <td style={{ ...tdS, color: 'var(--text3)' }}>{emp.email}</td>
                <td style={tdS}>
                  <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', background: emp.role === Role.ADMIN ? 'var(--accent-l)' : 'var(--blue-l)', color: emp.role === Role.ADMIN ? 'var(--accent)' : 'var(--blue)' }}>
                    {emp.role}
                  </span>
                </td>
                <td style={tdS}>
                  <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', background: emp.active ? 'var(--green-l)' : 'var(--bg2)', color: emp.active ? 'var(--green)' : 'var(--text3)' }}>
                    {emp.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={tdS}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(emp)} style={{ padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, fontWeight: 600 }}>
                      Editar
                    </button>
                    <button onClick={() => openSched(emp)} style={{ padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, fontWeight: 600 }}>
                      Escala
                    </button>
                    {emp.active && (
                      <button
                        onClick={() => { if (window.confirm(`Desativar ${emp.name}?`)) deactivateMut.mutate(emp.id); }}
                        style={{ padding: '6px 12px', background: 'var(--red-l)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'var(--red)', fontSize: 12, fontWeight: 600 }}
                      >
                        Desativar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
          onClick={e => e.target === e.currentTarget && setModal(null)}
        >
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 32, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
              {modal === 'create' ? '+ Novo Funcionário' : modal === 'edit' ? 'Editar Funcionário' : `Escala — ${selEmp?.name}`}
            </h2>
            {error && <div style={{ background: 'var(--red-l)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r)', padding: '10px 13px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <form onSubmit={submit}>
              {modal !== 'schedule' ? (
                <>
                  <div><label style={lbl}>NOME</label><input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div style={{ marginTop: 14 }}><label style={lbl}>E-MAIL</label><input style={inp} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  {modal === 'create' && (
                    <>
                      <div style={{ marginTop: 14 }}><label style={lbl}>SENHA</label><input style={inp} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                      <div style={{ marginTop: 14 }}>
                        <label style={lbl}>PERFIL</label>
                        <select style={inp} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
                          <option value={Role.EMPLOYEE}>Funcionário</option>
                          <option value={Role.ADMIN}>Administrador</option>
                        </select>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={lbl}>ENTRADA</label><input style={inp} type="time" value={sched.expectedStart} onChange={e => setSched({ ...sched, expectedStart: e.target.value })} /></div>
                    <div><label style={lbl}>SAÍDA</label><input style={inp} type="time" value={sched.expectedEnd} onChange={e => setSched({ ...sched, expectedEnd: e.target.value })} /></div>
                  </div>
                  <div style={{ marginTop: 14 }}><label style={lbl}>INTERVALO (min)</label><input style={inp} type="number" value={sched.breakMinutes} onChange={e => setSched({ ...sched, breakMinutes: +e.target.value })} /></div>
                  <div style={{ marginTop: 14 }}>
                    <label style={lbl}>DIAS DA SEMANA</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DAYS.map((d, i) => (
                        <button key={i} type="button" onClick={() => toggleDay(i)} style={{ padding: '7px 11px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${sched.weekdays.includes(i) ? 'var(--accent)' : 'var(--border)'}`, background: sched.weekdays.includes(i) ? 'var(--accent)' : 'var(--bg2)', color: sched.weekdays.includes(i) ? '#fff' : 'var(--text3)' }}>{d}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <Btn onClick={() => setModal(null)} style={{ flex: 1 }}>Cancelar</Btn>
                <Btn color="var(--accent)" style={{ flex: 1 }}>Salvar</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

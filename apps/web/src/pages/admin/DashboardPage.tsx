import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportsApi, employeesApi } from '../../services/api';
import { formatMinutes, MONTH_NAMES } from '@ponto/utils';

const now = new Date();

function KpiCard({ icon, label, value, accent = 'var(--text)' }: {
  icon: string; label: string; value: string; accent?: string;
}) {
  return (
    <div style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '20px',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 17, color: 'var(--text3)', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: 'var(--accent-l)', border: '1px solid rgba(255,107,0,0.2)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)',
      flexShrink: 0, marginRight: 10, verticalAlign: 'middle',
    }}>{name[0]}</div>
  );
}

export default function DashboardPage() {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn:  employeesApi.list,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['all-reports', now.getFullYear(), now.getMonth() + 1],
    queryFn:  () => reportsApi.all(now.getFullYear(), now.getMonth() + 1),
  });

  const rList = reports as any[];

  const active     = (employees as any[]).filter(e => e.active).length;
  const totalMin   = rList.reduce((a, r) => a + r.totalWorkedMinutes,   0);
  const overtime   = rList.reduce((a, r) => a + r.totalOvertimeMinutes, 0);
  const absences   = rList.reduce((a, r) => a + r.totalAbsences,        0);

  const chartData = rList.map(r => ({
    name:    r.employee.name.split(' ')[0],
    horas:   Math.round(r.totalWorkedMinutes   / 60 * 10) / 10,
    extras:  Math.round(r.totalOvertimeMinutes / 60 * 10) / 10,
    atrasos: Math.round(r.totalLateMinutes     / 60 * 10) / 10,
  }));

  const thStyle: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left',
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)',
    letterSpacing: 1, fontWeight: 600,
  };
  const tdStyle: React.CSSProperties = { padding: '13px 16px', fontSize: 13 };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2 }}>VISÃO GERAL</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>Dashboard</h1>
        <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
          {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard icon="◎"  label="Funcionários ativos"  value={String(active)} />
        <KpiCard icon="◷"  label="Total de horas"       value={formatMinutes(totalMin)} accent="var(--accent)" />
        <KpiCard icon="▲"  label="Horas extras"         value={formatMinutes(overtime)} accent="var(--green)"  />
        <KpiCard icon="✕"  label="Faltas no mês"        value={String(absences)}        accent="var(--red)"    />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '22px 20px' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 18 }}>
            HORAS POR FUNCIONÁRIO
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={14} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
              <YAxis stroke="var(--border)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                cursor={{ fill: 'var(--bg2)' }}
              />
              <Bar dataKey="horas"   fill="#ff6b00" radius={[4,4,0,0]} name="Trabalhadas" />
              <Bar dataKey="extras"  fill="#22c55e" radius={[4,4,0,0]} name="Extras"      />
              <Bar dataKey="atrasos" fill="#f59e0b" radius={[4,4,0,0]} name="Atraso"      />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Banco de horas */}
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 18, flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 12 }}>
              BANCO DE HORAS
            </div>
            {rList.map(r => (
              <div key={r.employee.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{r.employee.name.split(' ')[0]}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                  color: r.bankMinutes >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {r.bankMinutes >= 0 ? '+' : ''}{formatMinutes(r.bankMinutes)}
                </span>
              </div>
            ))}
          </div>
          {/* Faltas */}
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 18, flex: 1 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 12 }}>
              FALTAS
            </div>
            {rList.filter(r => r.totalAbsences > 0).length === 0
              ? <div style={{ color: 'var(--green)', fontSize: 13 }}>Sem faltas este mês ✓</div>
              : rList.filter(r => r.totalAbsences > 0).map(r => (
                  <div key={r.employee.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{r.employee.name.split(' ')[0]}</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--red)', fontWeight: 700 }}>{r.totalAbsences}d</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5 }}>
          RESUMO MENSAL — {MONTH_NAMES[now.getMonth()].toUpperCase()} {now.getFullYear()}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Funcionário','Dias','Horas','Extras','Atrasos','Faltas','Banco'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Carregando...</td></tr>
            )}
            {rList.map(r => (
              <tr key={r.employee.id} style={{ borderBottom: '1px solid var(--bg2)' }}>
                <td style={tdStyle}>
                  <Avatar name={r.employee.name} />
                  <span style={{ fontWeight: 500, verticalAlign: 'middle' }}>{r.employee.name}</span>
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                  {r.days.filter((d: any) => !d.isAbsent).length}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700 }}>
                  {formatMinutes(r.totalWorkedMinutes)}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--green)' }}>
                  {formatMinutes(r.totalOvertimeMinutes)}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: 'var(--yellow)' }}>
                  {formatMinutes(r.totalLateMinutes)}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', color: r.totalAbsences > 0 ? 'var(--red)' : 'var(--text3)' }}>
                  {r.totalAbsences}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontWeight: 700, color: r.bankMinutes >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {r.bankMinutes >= 0 ? '+' : ''}{formatMinutes(r.bankMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

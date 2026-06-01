import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { reportsApi }   from '../../services/api';
import {
  formatMinutes, MONTH_SHORT, dayOfWeek, ENTRY_LABELS, ENTRY_COLORS,
} from '@ponto/utils';
import { EntryType } from '@ponto/types';

const now0 = new Date();
const pad  = (n: number) => String(n).padStart(2, '0');
const fmt  = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function HistoryPage() {
  const user = useAuthStore(s => s.user!);
  const [month, setMonth] = useState(now0.getMonth() + 1);
  const [year,  setYear]  = useState(now0.getFullYear());
  const years = [now0.getFullYear() - 1, now0.getFullYear()];

  const { data, isLoading } = useQuery({
    queryKey: ['my-report', user.id, year, month],
    queryFn:  () => reportsApi.my(year, month),
  });

  return (
    <div style={{ padding: '20px 16px 8px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2 }}>
          HISTÓRICO
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>Meu Ponto</div>
      </div>

      {/* Year */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {years.map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            padding: '6px 14px', borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
            border: `1px solid ${y === year ? 'var(--accent)' : 'var(--border)'}`,
            background: y === year ? 'var(--accent-l)' : 'var(--bg2)',
            color: y === year ? 'var(--accent)' : 'var(--text3)',
          }}>{y}</button>
        ))}
      </div>

      {/* Month chips */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 6, marginBottom: 20, paddingBottom: 4 }}>
        {MONTH_SHORT.map((m, i) => {
          const val = i + 1;
          return (
            <button key={val} onClick={() => setMonth(val)} style={{
              flexShrink: 0, padding: '7px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              border: `1px solid ${val === month ? 'var(--accent)' : 'var(--border)'}`,
              background: val === month ? 'var(--accent)' : 'var(--bg2)',
              color: val === month ? '#fff' : 'var(--text3)',
            }}>{m}</button>
          );
        })}
      </div>

      {/* Summary cards */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Trabalhado',   val: formatMinutes(data.totalWorkedMinutes),   color: 'var(--accent)' },
            { label: 'Horas extras', val: formatMinutes(data.totalOvertimeMinutes), color: 'var(--green)'  },
            { label: 'Atrasos',      val: formatMinutes(data.totalLateMinutes),     color: 'var(--yellow)' },
            { label: 'Banco',        val: formatMinutes(data.bankMinutes),          color: data.bankMinutes >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--bg1)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: 14,
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: item.color }}>
                {item.val}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Carregando...</div>
      )}

      {/* Day blocks */}
      {(data?.days ?? []).map((day: any) => (
        <div key={day.date} style={{
          background: 'var(--bg1)', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', padding: '14px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: day.entries.length > 0 ? 10 : 0 }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{dayOfWeek(day.date)}</span>
              <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 6 }}>
                {day.date.split('-').reverse().join('/')}
              </span>
              {day.isAbsent && (
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                  FALTA
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
              {formatMinutes(day.workedMinutes)}
            </div>
          </div>
          {day.entries.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {day.entries.map((e: any) => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 'var(--r-sm)',
                  background: 'var(--bg2)',
                  border: `1px solid ${ENTRY_COLORS[e.type as EntryType]}30`,
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: ENTRY_COLORS[e.type as EntryType] }}>
                    {fmt(e.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

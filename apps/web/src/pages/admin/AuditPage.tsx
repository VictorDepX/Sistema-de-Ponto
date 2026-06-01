import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/api';

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDT = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ACTION_COLOR: Record<string, string> = {
  CREATE:     'var(--green)',
  UPDATE:     'var(--yellow)',
  ADJUSTMENT: 'var(--accent)',
  DELETE:     'var(--red)',
};
const ACTION_BG: Record<string, string> = {
  CREATE:     'var(--green-l)',
  UPDATE:     'var(--yellow-l)',
  ADJUSTMENT: 'var(--accent-l)',
  DELETE:     'var(--red-l)',
};

export default function AuditPage() {
  const [entity,   setEntity]   = useState('');
  const [page,     setPage]     = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', entity, page],
    queryFn:  () => auditApi.list({ entity: entity || undefined, page, limit: 30 }),
  });

  const logs  = (data?.data  ?? []) as any[];
  const total = data?.meta?.totalPages ?? 1;

  const thS: React.CSSProperties = {
    padding: '11px 16px', textAlign: 'left',
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)',
    letterSpacing: 1, fontWeight: 600,
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2 }}>
          RASTREABILIDADE
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>Auditoria</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
          Histórico imutável de todas as alterações do sistema.
        </p>
      </div>

      {/* Entity filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['', 'Employee', 'TimeEntry'].map(e => (
          <button key={e} onClick={() => { setEntity(e); setPage(1); }} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: `1px solid ${entity === e ? 'var(--accent)' : 'var(--border)'}`,
            background: entity === e ? 'var(--accent)' : 'var(--bg2)',
            color: entity === e ? '#fff' : 'var(--text3)',
          }}>
            {e || 'Todos'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 20,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Data/Hora','Ação','Entidade','Realizado por',''].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
                  Carregando...
                </td>
              </tr>
            )}

            {logs.map(log => (
              <React.Fragment key={log.id}>
                <tr
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  style={{
                    borderBottom: `1px solid ${expanded === log.id ? 'transparent' : 'var(--bg2)'}`,
                    cursor: 'pointer',
                    background: expanded === log.id ? 'var(--bg2)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>
                    {fmtDT(log.createdAt)}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 9px', borderRadius: 6,
                      fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                      background: ACTION_BG[log.action]    ?? 'var(--bg2)',
                      color:      ACTION_COLOR[log.action] ?? 'var(--text3)',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontWeight: 600 }}>{log.entity}</span>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 11, marginLeft: 8 }}>
                      {String(log.entityId).slice(0, 8)}…
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 500 }}>
                    {log.performer?.name ?? String(log.performedBy).slice(0, 8)}
                  </td>
                  <td style={{ padding: '13px 16px', color: 'var(--accent)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                    {expanded === log.id ? '▲' : '▼'}
                  </td>
                </tr>

                {expanded === log.id && (log.oldValue || log.newValue) && (
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={5} style={{ padding: '0 16px 16px', background: 'var(--bg2)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 16 }}>
                        {log.oldValue && (
                          <div>
                            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 8 }}>
                              ANTES
                            </div>
                            <pre style={{
                              margin: 0, color: 'var(--red)', fontSize: 12,
                              fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                              lineHeight: 1.6, background: 'var(--red-l)',
                              padding: '10px 12px', borderRadius: 'var(--r-sm)',
                            }}>
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValue && (
                          <div>
                            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 8 }}>
                              DEPOIS
                            </div>
                            <pre style={{
                              margin: 0, color: 'var(--green)', fontSize: 12,
                              fontFamily: 'var(--mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                              lineHeight: 1.6, background: 'var(--green-l)',
                              padding: '10px 12px', borderRadius: 'var(--r-sm)',
                            }}>
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {!isLoading && logs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
                  Nenhum log encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 18px', background: 'var(--bg2)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              color: page === 1 ? 'var(--text3)' : 'var(--text)', fontSize: 13, fontWeight: 600,
            }}
          >
            ← Anterior
          </button>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)' }}>
            {page} / {total}
          </span>
          <button
            onClick={() => setPage(p => Math.min(total, p + 1))}
            disabled={page === total}
            style={{
              padding: '8px 18px', background: 'var(--bg2)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              color: page === total ? 'var(--text3)' : 'var(--text)', fontSize: 13, fontWeight: 600,
            }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

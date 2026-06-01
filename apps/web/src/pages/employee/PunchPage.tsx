import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { entriesApi }   from '../../services/api';
import {
  ENTRY_LABELS, ENTRY_COLORS, calcWorkedMinutes, fmtTime, pad,
} from '@ponto/utils';
import { EntryType } from '@ponto/types';

export default function PunchPage() {
  const user = useAuthStore(s => s.user!);
  const qc   = useQueryClient();
  const [now, setNow] = useState(new Date());
  const [feedback, setFeedback] = useState<{ type: EntryType; time: string } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: status } = useQuery({
    queryKey:       ['status'],
    queryFn:        entriesApi.status,
    refetchInterval: 30_000,
  });

  const entries  = (status?.entries ?? []) as Array<{ type: string; timestamp: string }>;
  const nextType = (status?.nextType ?? EntryType.CLOCK_IN) as EntryType | null;
  const worked   = calcWorkedMinutes(
    entries.map(e => ({ type: e.type as EntryType, timestamp: e.timestamp })),
  );

  const punchMut = useMutation({
    mutationFn: (type: EntryType) =>
      entriesApi.punch({
        type,
        timestamp: new Date().toISOString(),
        timezone:  'America/Sao_Paulo',
      }),
    onSuccess: (_data, type) => {
      setFeedback({ type, time: `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` });
      setTimeout(() => setFeedback(null), 3000);
      qc.invalidateQueries({ queryKey: ['status'] });
    },
  });

  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const secsStr = pad(now.getSeconds());
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const btnColor = nextType ? ENTRY_COLORS[nextType] : 'var(--bg3)';
  const workedH  = Math.floor(worked / 60);
  const workedM  = worked % 60;

  const ICONS: Record<EntryType, string> = {
    [EntryType.CLOCK_IN]:    '↗',
    [EntryType.BREAK_START]: '⏸',
    [EntryType.BREAK_END]:   '▶',
    [EntryType.CLOCK_OUT]:   '↙',
  };

  return (
    <div style={{ padding: '0 0 8px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>OLÁ,</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>{user.name.split(' ')[0]}</div>
      </div>

      {/* Clock card */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: 'var(--bg1)', border: '1px solid rgba(255,107,0,0.15)',
          borderRadius: 'var(--r-xl)', padding: '28px 24px 24px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${btnColor}, transparent)`,
          }} />
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 54, fontWeight: 700,
            color: 'var(--text)', letterSpacing: -2, lineHeight: 1,
          }}>
            {timeStr}
            <span style={{ fontSize: 22, color: 'var(--text3)', marginLeft: 4 }}>{secsStr}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8, textTransform: 'capitalize' }}>
            {dateStr}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            marginTop: 14, padding: '7px 16px',
            background: 'var(--bg2)', borderRadius: 30, border: '1px solid var(--border)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--green)', fontWeight: 600 }}>
              {pad(workedH)}:{pad(workedM)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>trabalhado hoje</span>
          </div>
        </div>
      </div>

      {/* Punch button */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          onClick={() => nextType && punchMut.mutate(nextType)}
          disabled={!nextType || punchMut.isPending}
          style={{
            width: '100%', padding: '20px',
            background: nextType ? btnColor : 'var(--bg2)',
            border:     `1px solid ${nextType ? 'transparent' : 'var(--border)'}`,
            borderRadius: 'var(--r-lg)',
            color: nextType ? '#fff' : 'var(--text3)',
            fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, letterSpacing: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: nextType ? `0 0 28px ${btnColor}40` : 'none',
            opacity: punchMut.isPending ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {punchMut.isPending
            ? '...'
            : nextType
              ? <>{ICONS[nextType]}  REGISTRAR {ENTRY_LABELS[nextType].toUpperCase()}</>
              : '✓  EXPEDIENTE ENCERRADO'}
        </button>

        {feedback && (
          <div style={{
            marginTop: 10, padding: '11px 16px',
            background: `${ENTRY_COLORS[feedback.type]}15`,
            border: `1px solid ${ENTRY_COLORS[feedback.type]}40`,
            borderRadius: 'var(--r)', textAlign: 'center',
            fontFamily: 'var(--mono)', fontSize: 13,
            color: ENTRY_COLORS[feedback.type],
            animation: 'fadeIn 0.2s ease',
          }}>
            ✓ {ENTRY_LABELS[feedback.type]} registrada às {feedback.time}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ padding: '22px 20px 0', flex: 1 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2, marginBottom: 14 }}>
          REGISTROS DE HOJE
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>
            Nenhum registro ainda
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 18, top: 8, bottom: 8,
              width: 1, background: 'var(--border)',
            }} />
            {entries.map((e, i) => {
              const type = e.type as EntryType;
              const color = ENTRY_COLORS[type];
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  marginBottom: i < entries.length - 1 ? 16 : 0,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${color}18`, border: `1.5px solid ${color}60`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color,
                    zIndex: 1, position: 'relative',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {ENTRY_LABELS[type]}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color }}>
                    {fmtTime(e.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

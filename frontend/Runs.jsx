import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react'
import api from '../api'

const STATUS_CONFIG = {
  completed:  { Icon: CheckCircle, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  failed:     { Icon: XCircle,     color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  pending:    { Icon: Clock,       color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  processing: { Icon: Loader,      color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
}

export default function Runs() {
  const [runs, setRuns] = useState([])

  useEffect(() => {
    api.get('/runs/').then(r => setRuns(r.data))
  }, [])

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.4px' }}>
          Ingestion Runs
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
          Full history of every file upload and API pull
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['Run', 'Source', 'File', 'Status', 'Ingested', 'Errors', 'Started'].map(h => (
                <th key={h} style={{
                  padding: '11px 20px', textAlign: 'left', fontSize: 11,
                  fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No runs yet</td></tr>
            ) : runs.map((run, i) => {
              const s = STATUS_CONFIG[run.status] || STATUS_CONFIG.pending
              const Icon = s.Icon
              return (
                <tr
                  key={run.id}
                  style={{ borderBottom: i < runs.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-faint)' }}>
                    #{run.id}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
                      padding: '2px 8px', borderRadius: 4,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}>
                      {run.source}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>
                    {run.file_name || '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '3px 10px', borderRadius: 20, fontSize: 11,
                      fontWeight: 600, background: s.bg, color: s.color,
                    }}>
                      <Icon size={11} />
                      <span style={{ textTransform: 'capitalize' }}>{run.status}</span>
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 600, fontFamily: 'monospace' }}>
                  {run.success_count}
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: run.error_count > 0 ? '#dc2626' : 'var(--text-faint)' }}>
                    {run.error_count}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import api from '../api'

const STATUS = {
  pending:  { color: '#d97706', bg: 'rgba(217,119,6,0.1)',   label: 'Pending',  Icon: Clock },
  flagged:  { color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   label: 'Flagged',  Icon: AlertTriangle },
  approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   label: 'Approved', Icon: CheckCircle },
  rejected: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Rejected', Icon: XCircle },
}

const SCOPE_COLOR = { scope1: '#c0392b', scope2: '#d97706', scope3: '#2563eb' }

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <s.Icon size={10} />
      {s.label}
    </span>
  )
}

const Select = ({ value, onChange, options, label }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    padding: '7px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', cursor: 'pointer', outline: 'none',
  }}>
    <option value="">{label}: All</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
)

const labelColor = (label) => {
  if (label === 'Flag Reason') return '#dc2626'
  return 'var(--text-muted)'
}

const labelTextColor = (label) => {
  if (label === 'Flag Reason') return '#dc2626'
  return 'var(--text)'
}

export default function Review() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', scope: '', source_type: '' })
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)

  const fetchRows = () => {
    setLoading(true)
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    )
    api.get('/rows/?' + params).then(r => {
      setRows(r.data)
      setLoading(false)
    })
  }

  useEffect(() => { fetchRows() }, [filters])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    await api.patch('/rows/' + id + '/', { status })
    setRows(rows.map(r => r.id === id ? { ...r, status } : r))
    setUpdating(null)
  }

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  const getDetails = (row) => [
    ['Description', row.description || '—'],
    ['Location', row.location || row.vendor || '—'],
    ['Emission Factor', (row.emission_factor || '—') + ' - ' + (row.emission_factor_source || '—')],
    row.flagged_reason ? ['Flag Reason', row.flagged_reason] : null,
    ['Raw Value', row.raw_value + ' ' + row.raw_unit],
    ['Rev', row.reviewed_by_username || '—'],
  ].filter(Boolean)

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.4px' }}>
          Review Queue
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
          Approve or reject emission rows before audit lock
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <Select value={filters.status} onChange={v => setFilter('status', v)} options={['pending','flagged','approved','rejected']} label="Status" />
        <Select value={filters.scope} onChange={v => setFilter('scope', v)} options={['scope1','scope2','scope3']} label="Scope" />
        <Select value={filters.source_type} onChange={v => setFilter('source_type', v)} options={['sap','utility','travel']} label="Source" />
        <span style={{ marginLeft: 'auto', fontSe: 13, color: 'var(--text-muted)' }}>{rows.length} rows</span>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {['', 'Date', 'Source', 'Scope', 'Category', 'Value', 'CO2e kg', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '11px 16px', textAlign: 'left', fontSize: 11,
                  fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No rows found
                </td>
              </tr>
            ) : rows.map(row => (
              <>
                <tr
                  key={row.id}
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: expanded === row.id ? 'var(--bg-hover)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (expanded !== row.id) e.currentTarget.style.background = 'var(--bg-hover)'
                  }}
                  onMouseLeave={e => {
                    if (expanded !== row.id) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={{ padding: '12px 8px 12px 16px', color: 'var(--text-faint)' }}>
                    {expanded === row.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>
                    {row.activity_date}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
                      padding: '2px 8px', borderRadius: 4,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}>
                      {(row.source_type || '').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: SCOPE_COLOR[row.scope] || 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {row.scope}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text)', textTransform: 'capitalize' }}>
                    {(row.category || '').replace('_', ' ')}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)' }}>
                    {(row.normalized_value || 0).toFixed(1)} {row.normalized_unit}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                    {row.co2e_kg ? row.co2e_kg.toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge atus={row.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      {row.status !== 'approved' && !row.is_locked && (
                        <button
                          onClick={() => updateStatus(row.id, 'approved')}
                          disabled={updating === row.id}
                          style={{
                            padding: '4px 12px', borderRadius: 6,
                            border: '1px solid rgba(22,163,74,0.3)',
                            background: 'rgba(22,163,74,0.08)', color: '#16a34a',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}
                        >Approve</button>
                      )}
                      {row.status !== 'rejected' && !row.is_locked && (
                        <button
                          onClick={() => updateStatus(row.id, 'rejected')}
                          disabled={updating === row.id}
                          style={{
                            padding: '4px 12px', borderRadius: 6,
                            border: '1px solid rgba(220,38,38,0.3)',
                            background: 'rgba(220,38,38,0.08)', color: '#dc2626',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}
                        >Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded === row.id && (
                  <tr key={'exp-' + row.id}>
                    <td colSpan={9} style={{
                      background: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                      padding: '16px 24px',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 13 }}>
                        {getDetails(row).map(([lbl, val]) => (
                          <div key={lbl}>
                            <div style={{
                              fontSize: 11, fontWeight: 600,
                              color: labelColor(lbl),
                              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
                            }}>{lbl}</div>
                            <div style={{ color: labelTextColor(lbl), fontFamily: 'monospace', fontSize: 12 }}>
                              {val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

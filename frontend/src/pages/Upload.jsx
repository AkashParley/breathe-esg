import { useState } from 'react'
import { Upload as UploadIcon, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import api from '../api'

const SOURCES = [
  { type: 'sap',     label: 'SAP Export',      desc: 'IDoc flat file · MB51 material documents', scope: 'Scope 1', tag: 'Fuel & Procurement', color: '#c0392b' },
  { type: 'utility', label: 'Utility Data',     desc: 'Green Button CSV · meter consumption data', scope: 'Scope 2', tag: 'Electricity',        color: '#d97706' },
  { type: 'travel',  label: 'Corporate Travel', desc: 'Concur / Navan expense CSV export',          scope: 'Scope 3', tag: 'Flights & Hotels',   color: '#2563eb' },
]

const UploadCard = ({ source }) => {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(false)

  const upload = async () => {
    if (!file) rurn
    setLoading(true)
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('source_type', source.type)
    try {
      const res = await api.post('/upload/', fd)
      setResult({ ok: true, data: res.data })
    } catch (e) {
      setResult({ ok: false, msg: e.response?.data?.error || 'Upload failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '24px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: source.color, letterSpacing: '0.5px', marginBottom: 4 }}>
            {source.scope}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {source.label}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {source.desc}
          </p>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20,
          background: 'var(--bg)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', whiteSpace: 'nowrap',
        }}>
          {source.tag}
        </span>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault()
          setDrag(false)
          const f = e.dataTransfer.files[0]
          if (f) { setFile(f); setResult(null) }
        }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '28px 20px', borderRadius: 10,
          cursor: 'pointer',
          border: drag ? '2px dashed ' + source.color : '2px dashed var(--border)',
          background: drag ? 'var(--bg-hover)' : 'var(--bg)',
          transition: 'all 0.15s', marginBottom: 12,
        }}
      >
        <FileText size={20} color={file ? source.color : 'var(--text-faint)'} />
        <span style={{ fontSize: 13, color: file ? 'var(--text)' : 'var(--text-muted)', textAlign: 'center' }}>
          {file ? file.name : 'Drop CSV here or click to browse'}
        </span>
        {!file && (
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>CSV files only</span>
        )}
        <input
          type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => { setFile(e.target.files[0]); setResult(null) }}
        />
      </label>

      <button
        onClick={upload}
        disabled={!file || loading}
        style={{
          width: '100%', padding: '10px', borderRadius: 8,
          background: file ? source.color : 'var(--border)',
          border: 'none', cursor: file ? 'pointer' : 'default',
          color: 'white', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
        }}
      >
        <UploadIcon size={14} />
        {loading ? 'Processing...' : 'Upload & Ingest'}
      </button>

      {result && (
        <div style={{
          marginTop: 12, padding: '12px 14px', borderRadius: 8, fontSize: 13,
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: result.ok ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
          color: result.ok ? '#16a34a' : '#dc2626',
          border: result.ok ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(220,38,38,0.2)',
        }}>
          {result.ok ? (
            <>
              <CheckCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>Ingested <strong>{result.data.success_count}</strong> rows. {result.data.error_count > 0 ? result.data.error_count + ' errors.' : 'No errors.'}</span>
            </>
          ) : (
            <>
              <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{result.msg}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Upload() {
  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.4px' }}>
          Upload Data
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
          Ingest emissions data from your source systems
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {SOURCES.map(s => <UploadCard key={s.type} source={s} />)}
      </div>
    </div>
  )
}

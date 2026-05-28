import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, ArrowRight } from 'lucide-react'
import api from '../api'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dark = localStorage.getItem('theme') !== 'light'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      navigate('/dashboard')
    } catch { setError('Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

      {/* Left panel */}
      <div style={{
        flex: 1, background: '#1a5c38', display: 'flex',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Leaf size={22} color="rgba(255,255,255,0.9)" />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>Breathe ESG</span>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 40, fontWeight: 300, color: 'white', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 16 }}>
            Carbon data,<br /><em>made auditable.</em>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.7, maxWidth: 340 }}>
            Ingest, normalize, and review emissions data from SAP, utility portals, and corporate travel before it reaches auditors.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 32, position: 'relative' }}>
          {[['Scope 1', 'Direct'], ['Scope 2', 'Electricity'], ['Scope 3', 'Travel']].map(([s, l]) => (
            <div key={s}>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{s}</div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 500, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: 460, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '48px',
        background: 'var(--bg-card)',
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 }}>
            Analyst Sign In
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            Sign in to review and approve emissions data
          </p>

          {/* Demo credentials box */}
          <div style={{
            padding: '12px 14px', borderRadius: 10, marginBottom: 24,
            background: 'var(--bg)', border: '1px solid var(--border)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--text-faint)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8,
            }}>
              Demo Credentials
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Username</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#16a34a', fontWeight: 700, letterSpacing: '0.5px' }}>admin</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Password</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#16a34a', fontWeight: 700, letterSpacing: '0.5px' }}>admin123</span>
            </div>
          </div>

          <form onSubmit={submit}>
            {['username', 'password'].map(field => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 600,
                  color: 'var(--text-muted)', marginBottom: 6,
                  textTransform: 'capitalize', letterSpacing: '0.4px',
                }}>
                  {field}
                </label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={form[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  placeholder={field === 'username' ? 'admin' : 'admin123'}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 14, outline: 'none',
                    transition: 'border 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1a5c38'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}

            {error && (
              <div style={{
                color: '#ef4444', fontSize: 13, marginBottom: 14,
                padding: '10px 14px', background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px 20px', borderRadius: 8,
              background: '#1a5c38', border: 'none', cursor: 'pointer',
              color: 'white', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
              marginTop: 4,
            }}>
              {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

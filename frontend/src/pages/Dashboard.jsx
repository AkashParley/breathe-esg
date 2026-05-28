import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar, PieChart, Pie,
} from 'recharts'
import { CheckCircle, AlertTriangle, Clock, XCircle, TrendingUp, Zap, Plane, Flame } from 'lucide-react'
import api from '../api'

const SCOPE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6']
const SOURCE_COLORS = { SAP: '#ef4444', TRAVEL: '#f59e0b', UTILITY: '#3b82f6' }

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    boxShadow: 'var(--shadow)',
    ...style,
  }}>
    {children}
  </div>
)

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <Card style={{ padding: '20px 22px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '-1px', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: color + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div style={{ marginTop: 16, height: 3, borderRadius: 2, background: 'var(--border)' }}>
      <div style={{ height: '100%', borderRadius: 2, background: color, width: Math.min(100, value * 10) + '%', transition: 'width 1s ease' }} />
    </div>
  </Card>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text)', fontWeight: 600 }}>
          {p.value} {p.name === 'co2e' ? 'tCO2e' : p.name === 'rows' ? 'rows' : ''}
        </div>
      ))}
    </div>
  )
}

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
    {children}
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    api.get('/dashboard/').then(r => {
      setStats(r.data)
      setTimeout(() => setAnimating(true), 100)
    })
  }, [])

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 14 }}>
      Loading...
    </div>
  )

  const scope1 = (stats.by_scope.scope1?.co2e || 0) / 1000
  const scope2 = (stats.by_scope.scope2?.co2e || 0) / 1000
  const scope3 = (stats.by_scope.scope3?.co2e || 0) / 1000
  const totalCo2e = scope1 + scope2 + scope3

  const scopeData = [
    { name: 'Scope 1', co2e: +scope1.toFixed(1), full: 'Direct Emissions' },
    { name: 'Scope 2', co2e: +scope2.toFixed(1), full: 'Electricity' },
    { name: 'Scope 3', co2e: +scope3.toFixed(1), full: 'Value Chain' },
  ]

  const sourceData = stats.by_source.map(s => ({
    name: (s['ingestion_run__source__source_type'] || '').toUpperCase(),
    rows: s.count,
    co2e: +((s.co2e || 0) / 1000).toFixed(1),
  }))

  const statusData = [
    { name: 'Approved', value: stats.approved, color: '#22c55e' },
    { name: 'Pending',  value: stats.pending,  color: '#f59e0b' },
    { name: 'Flagged',  value: stats.flagged,  color: '#ef4444' },
    { name: 'Rejected', value: stats.rejected, color: '#64748b' },
  ].filter(d => d.value > 0)

  const radialData = [
    { name: 'Scope 1', value: totalCo2e > 0 ? Math.round(scope1 / totalCo2e * 100) : 0, fill: '#ef4444' },
    { name: 'Scope 2', value: totalCo2e > 0 ? Math.round(scope2 / totalCo2e * 100) : 0, fill: '#f59e0b' },
    { name: 'Scope 3', value: totalCo2e > 0 ? Math.round(scope3 / totalCo2e * 100) : 0, fill: '#3b82f6' },
  ]

  const monthlyMock = [
    { month: 'Jan', scope1: 22, scope2: 45, scope3: 8 },
    { month: 'Feb', scope1: 19, scope2: 51, scope3: 6 },
    { month: 'Mar', scope1: 25, scope2: 120, scope3: 5 },
  ]

  const total = (stats.total_co2e_kg / 1000).toFixed(1)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>
            Emissions Dashboard
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Acme Corp · Q1 2024 · {stats.total_rows} records
          </p>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 20 }}>
          Last updated just now
        </div>
      </div>

      {/* Hero Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>

        {/* Big CO2 Card */}
        <div style={{
          background: 'var(--hero-bg)', borderRadius: 16, padding: '24px 28px',
          boxShadow: 'var(--shadow-lg)', gridRow: '1 / 3',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minHeight: 200, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
          position: 'absolute', right: -20, top: -20,
            width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }} />
          <div style={{
            position: 'absolute', right: 20, bottom: -30,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--hero-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
              Total CO2e Emissions
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 200, color: 'var(--hero-text)', letterSpacing: '-3px', lineHeight: 1 }}>
                {total}
              </span>
              <span style={{ fontSize: 16, color: 'var(--hero-muted)', fontWeight: 400 }}>tCO2e</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              {scopeData.map((s, i) => (
                <div key={s.name}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hero-text)' }}>{s.co2e}</div>
                  <div style={{ fontSize: 10, color: 'var(--hero-faint)', marginTop: 1 }}>{s.name}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex' }}>
              {scopeData.map((s, i) => (
                <div key={i} style={{
                  height: '100%',
                  width: animating && totalCo2e > 0 ? (s.co2e / totalCo2e * 100) + '%' : '0%',
                  background: SCOPE_COLORS[i],
                  transition: 'width 1.2s ease ' + (i * 0.2) + 's',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {scopeData.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: SCOPE_COLORS[i] }} />
                  <span style={{ fontSize: 10, color: 'var(--hero-faint)' }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="#f59e0b" />
        <StatCard label="Flagged" value={stats.flagged} icon={AlertTriangle} color="#ef4444" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="#22c55e" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="#64748b" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', gap: 16, marginBottom: 16 }}>

        {/* Stacked Area */}
        <Card style={{ padding: '20px 24px' }}>
          <SectionTitle>Monthly Emissions Trend (tCO2e)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyMock}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7c7a72' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#b5b3aa' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="scope1" stroke="#ef4444" strokeWidth={2} fill="url(#g1)" name="Scope 1" />
              <Area type="monotone" dataKey="scope2" stroke="#f59e0b" strokeWidth={2} fill="url(#g2)" name="Scope 2" />
              <Area type="monotone" dataKey="scope3" stroke="#3b82f6" strokeWidth={2} fill="url(#g3)" name="Scope 3" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Source Bar */}
        <Card style={{ padding: '20px 24px' }}>
          <SectionTitle>CO2e by Source (tCO2e)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sourceData} barSize={28} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#b5b3aa' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#7c7a72' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="co2e" radius={[0, 8, 8, 0]}>
                {sourceData.map((s, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[s.name] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Donut */}
        <Card style={{ padding: '20px 24px' }}>
          <SectionTitle>Review Status</SectionTitle>
          <div style={{ position: 'relative', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData} dataKey="value" cx="50%" cy="50%"
                  innerRadius={48} outerRadius={72} paddingAngle={3} startAngle={90} endAngle={-270}
                >
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{stats.total_rows}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>total</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
            {statusData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Scope Breakdown Bars */}
        <Card style={{ padding: '20px 24px' }}>
          <SectionTitle>Emissions by Scope (tCO2e)</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={scopeData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7c7a72' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#b5b3aa' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="co2e" radius={[8, 8, 0, 0]}>
                {scopeData.map((_, i) => <Cell key={i} fill={SCOPE_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Scope % breakdown */}
        <Card style={{ padding: '20px 24px' }}>
          <SectionTitle>Scope Contribution</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {scopeData.map((s, i) => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: SCOPE_COLORS[i] }} />
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.full}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {totalCo2e > 0 ? Math.round(s.co2e / totalCo2e * 100) : 0}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: SCOPE_COLORS[i],
                    width: animating && totalCo2e > 0 ? (s.co2e / totalCo2e * 100) + '%' : '0%',
                    transition: 'width 1s ease ' + (i * 0.15) + 's',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {s.co2e} tCO2e
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}

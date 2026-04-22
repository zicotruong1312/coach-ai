import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { agentImg, mapColor } from '../agentData'
import '../index.css'

const API = import.meta.env.VITE_API_URL || 'https://coach-ai-l2ks.onrender.com'

/* ─── Helpers ─── */
const ratingColor = (r) =>
  r >= 8 ? 'var(--teal)' : r >= 5 ? 'var(--yellow)' : 'var(--red)'

const ratingGrade = (r) =>
  r >= 9 ? 'S' : r >= 7 ? 'A' : r >= 5 ? 'B' : 'C'

const winrateClass = (pct) =>
  pct >= 55 ? 'winrate-high' : pct >= 45 ? '' : 'winrate-low'

function AgentAvatar({ name, size = 40 }) {
  const src = agentImg(name)
  const initials = (name || '?')[0].toUpperCase()
  if (src) return (
    <img src={src} alt={name} width={size} height={size}
      style={{ borderRadius: 4, objectFit: 'cover', background: 'var(--bg-card2)', flexShrink: 0 }}
      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
    />
  )
  return (
    <div style={{ width: size, height: size, borderRadius: 4, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.4, color: 'var(--red)', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

const mapEmojis = {
  Fracture: '⚡', Breeze: '🏝️', Bind: '🏺', Split: '🕌', Haven: '⛩️',
  Pearl: '🌊', Lotus: '🌸', Icebox: '❄️', Abyss: '🌑', Ascent: '🗺️',
}

/* ─── Navbar ─── */
function Navbar({ riotName, riotTag }) {
  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        <div className="brand-icon">🎯</div>
        CoachAI
      </a>
      <div className="navbar-divider" />
      {riotName && (
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
          {riotName}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>#{riotTag}</span>
        </span>
      )}
      <div className="navbar-spacer" />
      <div className="live-badge">Live</div>
    </nav>
  )
}

/* ─── Section Header ─── */
function SectionHeader({ title, action }) {
  return (
    <div className="section-header">
      <div className="section-title">{title}</div>
      {action && <span className="section-link">{action}</span>}
    </div>
  )
}

/* ─── Stat Row Item ─── */
function StatRowItem({ label, value, sub, pctColor }) {
  return (
    <div className="stat-row-item fade-up">
      <div className="stat-row-label">{label}</div>
      <div className="stat-row-value" style={pctColor ? { color: pctColor } : {}}>{value}</div>
      {sub && <div className="stat-row-sub">{sub}</div>}
    </div>
  )
}

/* ─── Match Row ─── */
function MatchRow({ match, idx }) {
  const isWin = match.result === 'Win' || match.result === 'W' || match.won === true
  const agent = match.agent || ''
  const map = match.map || 'Unknown'
  const k = match.kills ?? 0
  const d = match.deaths ?? 0
  const a = match.assists ?? 0
  const hs = match.headshotPct != null ? `${match.headshotPct}%` : '—'
  const kd = d > 0 ? (k / d).toFixed(1) : k.toString()
  const kdColor = parseFloat(kd) >= 1.0 ? 'var(--teal)' : 'var(--red)'
  const accentColor = mapColor(map)
  const timeAgo = match.playedAt
    ? (() => {
        const diff = Date.now() - new Date(match.playedAt).getTime()
        const h = Math.floor(diff / 3600000)
        const d2 = Math.floor(h / 24)
        return d2 > 0 ? `${d2} ngày trước` : h > 0 ? `${h} giờ trước` : 'Vừa xong'
      })()
    : `#${idx + 1}`

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderLeft: `4px solid ${isWin ? '#18e5b0' : '#ff4655'}`,
      borderRadius: 6, marginBottom: 4, overflow: 'hidden', minHeight: 72,
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.background='var(--bg-card)'}
    >
      {/* Result badge */}
      <div style={{
        width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: isWin ? 'rgba(24,229,176,0.08)' : 'rgba(255,70,85,0.08)',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: isWin ? '#18e5b0' : '#ff4655', writingMode: 'vertical-rl', letterSpacing: '0.1em' }}>
          {isWin ? 'WIN' : 'LOSS'}
        </span>
      </div>

      {/* Agent portrait */}
      <div style={{ width: 72, flexShrink: 0, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <AgentAvatar name={agent} size={64} />
      </div>

      {/* Map + mode + time */}
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>{map}</span>
          {agent && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-card2)', padding: '1px 7px', borderRadius: 3 }}>{agent}</span>}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>{timeAgo} // Competitive</div>
      </div>

      {/* K/D */}
      <div style={{ textAlign: 'center', padding: '12px 14px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 70 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 5 }}>K/D</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: kdColor }}>{kd}</div>
      </div>

      {/* K/D/A */}
      <div style={{ textAlign: 'center', padding: '12px 16px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 120 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 5 }}>K/D/A</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: 'var(--text)' }}>{k}</span>
          <span style={{ color: 'var(--text-dim)', margin: '0 3px' }}>/</span>
          <span style={{ color: '#ff4655' }}>{d}</span>
          <span style={{ color: 'var(--text-dim)', margin: '0 3px' }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{a}</span>
        </div>
      </div>

      {/* HS% */}
      <div style={{ textAlign: 'center', padding: '12px 16px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 70 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 5 }}>HS%</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: parseFloat(hs) >= 25 ? 'var(--teal)' : 'var(--text)' }}>{match.headshotPct ?? '—'}</div>
      </div>

      {/* ACS */}
      <div style={{ textAlign: 'center', padding: '12px 16px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 70 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 5 }}>ACS</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
          {match.rounds > 0 && match.score > 0 ? Math.round(match.score / match.rounds) : '—'}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function ReportPage() {
  const { discordId } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    axios.get(`${API}/api/report/${discordId}`)
      .then(r => { setReport(r.data); setLoading(false) })
      .catch(e => {
        setError(e.response?.data?.error || 'Không tìm thấy báo cáo.')
        setLoading(false)
      })
  }, [discordId])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Đang tải báo cáo...</p>
      </div>
    </>
  )

  if (error) return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '40px 24px' }}>
        <span style={{ fontSize: '3rem' }}>😔</span>
        <h2 style={{ color: 'var(--red)', fontWeight: 800 }}>Chưa có báo cáo</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '0.875rem', lineHeight: 1.7 }}>{error}</p>
        <div className="card card-sm" style={{ maxWidth: '340px', textAlign: 'left' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>
            💡 Dùng lệnh này trên Discord:
          </p>
          <code style={{ color: 'var(--teal)', fontSize: '0.875rem', fontWeight: 700 }}>/coach</code>
        </div>
      </div>
    </>
  )

  const { stats, aiAnalysis, riotName, riotTag, lastUpdatedAt } = report
  const ai = aiAnalysis || {}
  const s  = stats || {}
  const matchHistory = s.matchHistory || []

  const wins = matchHistory.filter(m => m.result === 'Win' || m.result === 'W' || m.won === true).length
  const losses = matchHistory.length - wins
  const winPct = matchHistory.length > 0 ? Math.round((wins / matchHistory.length) * 100) : 0

  const radarData = [
    { subject: 'AIM',     A: ai.radarScores?.aim         || 50 },
    { subject: 'MOVEMENT', A: ai.radarScores?.movement    || 50 },
    { subject: 'ABILITY', A: ai.radarScores?.abilityUsage || 50 },
    { subject: 'SENSE',   A: ai.radarScores?.gameSense    || 50 },
    { subject: 'TEAM',    A: ai.radarScores?.teamPlay     || 50 },
  ]

  const chartData = matchHistory.map((m, i) => ({
    name: `#${i + 1}`,
    Kills: m.kills,
    Deaths: m.deaths,
    Assists: m.assists,
    HS: m.headshotPct,
  }))

  const tabs = ['overview', 'matches', 'agents', 'training']
  const tabLabels = { overview: 'Overview', matches: 'Matches', agents: 'Agents & Maps', training: 'Training Plan' }

  return (
    <>
      <Navbar riotName={riotName} riotTag={riotTag} />

      {/* ── PROFILE BANNER ── */}
      <div className="profile-banner">
        <div className="profile-inner">
          <div className="profile-top">
            <div className="profile-avatar">
              {(riotName || '?')[0].toUpperCase()}
            </div>

            <div className="profile-info">
              <div className="profile-name">
                {riotName}
                <span className="profile-tag">#{riotTag}</span>
              </div>
              <div className="profile-meta">
                <span className="profile-meta-item">
                  📊 <strong>{s.matchCount || 0}</strong> trận đã phân tích
                </span>
                <span className="sep-dot">·</span>
                <span className="profile-meta-item">
                  🕐 Cập nhật <strong>{new Date(lastUpdatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</strong>
                </span>
              </div>
            </div>

            {/* Overall Rating */}
            <div className="rating-badge">
              <div className="rating-val" style={{ color: ratingColor(ai.overallRating || 5) }}>
                {ai.overallRating || '—'}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/10</span>
              </div>
              <div className="rating-label">AI Rating</div>
              <span className={`badge badge-${ratingGrade(ai.overallRating || 5) === 'S' ? 'yellow' : ratingGrade(ai.overallRating || 5) === 'A' ? 'teal' : 'blue'}`} style={{ marginTop: 4 }}>
                {ratingGrade(ai.overallRating || 5)} Tier
              </span>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profile-tabs">
            {tabs.map(t => (
              <div
                key={t}
                className={`profile-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {tabLabels[t]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-wrapper" style={{ paddingTop: '28px' }}>

        {/* ════════════ OVERVIEW TAB ════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Competitive Overview Banner */}
            <div className="section">
              <div className="overview-banner">
                <div className="overview-banner-left">
                  <div className="wl-ring">
                    <span className="wins">{wins}W</span>
                    <span className="losses">{losses}L</span>
                  </div>
                  <div>
                    <div className="overview-title">Competitive Overview</div>
                    <div className="overview-value">{winPct}% <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Win Rate</span></div>
                    <div className="overview-sub">{matchHistory.length} trận · {Math.round(matchHistory.length * 0.6)} giờ playtime (ước tính)</div>
                  </div>
                </div>

                {/* Playstyle */}
                {ai.playstyleType && (
                  <>
                    <div style={{ width: 1, height: 48, background: 'var(--border)' }} />
                    <div>
                      <div className="overview-title">Phong cách</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--red)', marginTop: 4 }}>{ai.playstyleType}</div>
                      <div className="overview-sub">{ai.proPlayerMatch ? `Giống ${ai.proPlayerMatch}` : ''}</div>
                    </div>
                  </>
                )}

                {/* Pro Match */}
                {ai.proPlayerMatch && (
                  <>
                    <div style={{ width: 1, height: 48, background: 'var(--border)' }} />
                    <div>
                      <div className="overview-title">Hình mẫu Pro</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--teal)', marginTop: 4 }}>⚡ {ai.proPlayerMatch}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Primary Stat Row */}
            <div className="section">
              <SectionHeader title="Thống Kê Chính" />
              <div className="stat-row">
                <StatRowItem
                  label="K/D Ratio"
                  value={s.kd || '—'}
                  sub={s.kdTrend ? `${s.kdTrend > 0 ? '▲' : '▼'} ${Math.abs(s.kdTrend)} vs 5 trận trước` : 'Last 5 avg'}
                  pctColor={s.kd >= 1 ? 'var(--teal)' : 'var(--red)'}
                />
                <StatRowItem label="Headshot %" value={`${s.avgHeadshotPct || 0}%`} sub="Avg all matches" pctColor={s.avgHeadshotPct >= 25 ? 'var(--teal)' : 'var(--yellow)'} />
                <StatRowItem label="Kills / Round" value={s.avgKills || '—'} sub="Per match avg" />
                <StatRowItem label="Deaths / Round" value={s.avgDeaths || '—'} sub="Per match avg" />
                <StatRowItem label="Assists / Round" value={s.avgAssists || '—'} sub="Per match avg" />
                <StatRowItem label="Win %" value={`${winPct}%`} sub={`${wins}W – ${losses}L`} pctColor={winPct >= 50 ? 'var(--teal)' : 'var(--red)'} />
              </div>
            </div>

            {/* Tracker Score + Radar Row */}
            <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Radar */}
              <div>
                <SectionHeader title="5 Chiều Năng Lực" />
                <div className="radar-wrapper" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height={360}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="78%">
                      <PolarGrid stroke="var(--border-light)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text)', fontSize: 12, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Bạn" dataKey="A" stroke="var(--red)" fill="var(--red)" fillOpacity={0.3} strokeWidth={2.5} dot={{ fill: 'var(--red)', r: 4 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div>
                <SectionHeader title="Điểm Mạnh & Yếu" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="card card-sm">
                    <div style={{ color: 'var(--teal)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>✅ Điểm Mạnh</div>
                    <div className="insight-list">
                      {(ai.strengths || []).map((str, i) => (
                        <div key={i} className="insight-item strength">
                          <span className="insight-bullet" style={{ color: 'var(--green)' }}>▶</span>
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card card-sm">
                    <div style={{ color: 'var(--red)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>⚠️ Cần Cải Thiện</div>
                    <div className="insight-list">
                      {(ai.weaknesses || []).map((w, i) => (
                        <div key={i} className="insight-item weakness">
                          <span className="insight-bullet" style={{ color: 'var(--red)' }}>▶</span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="section">
              <SectionHeader title="Nhận Xét Từ AI Coach" />
              <div className="ai-card">
                <p className="ai-quote">"{ai.summary || 'Không có nhận xét.'}"</p>
                <div className="ai-attribution">
                  <span>🤖</span> Gemini AI Coach · {new Date(lastUpdatedAt).toLocaleString('vi-VN', { dateStyle: 'medium' })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════ MATCHES TAB ════════════ */}
        {activeTab === 'matches' && (
          <>
            {/* Performance Chart */}
            {chartData.length > 0 && (
              <div className="section">
                <SectionHeader title="Performance Chart" />
                <div className="card">
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 10, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }}
                        labelStyle={{ color: 'var(--text)', fontWeight: 700 }}
                        itemStyle={{ color: 'var(--text-muted)' }}
                      />
                      <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: '0.75rem', paddingTop: '8px' }} />
                      <Area type="monotone" dataKey="Deaths" fill="var(--red)" stroke="var(--red)" fillOpacity={0.15} strokeWidth={1.5} dot={false} />
                      <Bar dataKey="Kills" barSize={16} fill="var(--red)" radius={[3, 3, 0, 0]} opacity={0.85} />
                      <Line type="monotone" dataKey="HS" stroke="var(--teal)" strokeWidth={2} dot={false} name="HS%" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Match List */}
            <div className="section">
              <SectionHeader title={`Last ${matchHistory.length} Matches`} />
              {matchHistory.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Chưa có lịch sử trận đấu
                </div>
              ) : (
                <div className="match-list">
                  {matchHistory.map((m, i) => (
                    <MatchRow key={i} match={m} idx={i} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════ AGENTS & MAPS TAB ════════════ */}
        {activeTab === 'agents' && (
          <>
            {/* Top Agents Table */}
            <div className="section">
              <SectionHeader title="Top Agents" action="View All" />
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="agent-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Matches</th>
                      <th>Win %</th>
                      <th>K/D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(s.topAgents || []).map((ag, i) => {
                      const name = typeof ag === 'string' ? ag : (ag.name || '')
                      const matches = typeof ag === 'object' ? ag.matches : null
                      const kd = typeof ag === 'object' ? ag.kd : null
                      const winPct = typeof ag === 'object' ? ag.winPct : null
                      const hsPct = typeof ag === 'object' ? ag.hsPct : null
                      const wpColor = winPct >= 55 ? 'var(--teal)' : winPct >= 45 ? 'var(--text)' : 'var(--red)'
                      return (
                        <tr key={name + i}>
                          <td>
                            <div className="agent-name-cell">
                              <AgentAvatar name={name} size={36} />
                              <div>
                                <div style={{ fontWeight: 700 }}>{name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {i === 0 ? 'Main' : i === 1 ? 'Secondary' : 'Flex'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{matches ?? '—'}</td>
                          <td><span style={{ color: wpColor, fontWeight: 700 }}>{winPct != null ? `${winPct}%` : '—'}</span></td>
                          <td style={{ color: kd >= 1 ? 'var(--teal)' : kd != null ? 'var(--red)' : 'var(--text-muted)' }}>{kd ?? '—'}</td>
                        </tr>
                      )
                    })}
                    {(!s.topAgents || s.topAgents.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          Chưa đủ dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Two column: Agents + Maps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <SectionHeader title="Đặc Vụ Hay Dùng" />
                <div className="mini-card-grid">
                  {(s.topAgents || []).map((ag, i) => {
                    const name = typeof ag === 'string' ? ag : (ag.name || '')
                    const winPct = typeof ag === 'object' ? ag.winPct : null
                    return (
                      <div key={name + i} className={`mini-card ${i === 0 ? 'featured' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <AgentAvatar name={name} size={48} />
                        <div className="mini-card-name">{name}</div>
                        <div className="mini-card-sub" style={{ color: i === 0 ? 'var(--yellow)' : 'var(--text-muted)' }}>
                          {i === 0 ? '★ Main' : `#${i + 1}`}
                        </div>
                        {winPct != null && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: winPct >= 50 ? 'var(--teal)' : 'var(--red)' }}>{winPct}% WR</div>}
                      </div>
                    )
                  })}
                </div>

                {/* Recommended Agents */}
                {ai.recommendedAgents?.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      Coach Gợi Ý
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ai.recommendedAgents.map(agent => (
                        <span key={agent} className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <AgentAvatar name={agent} size={16} /> {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <SectionHeader title="Map Thường Chơi" />
                <div className="mini-card-grid">
                  {(s.topMaps || []).map((map, i) => (
                    <div key={map} className={`mini-card ${i === 0 ? 'featured' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 6, background: mapColor(map), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                        {(map || '?')[0]}
                      </div>
                      <div className="mini-card-name">{map}</div>
                      <div className="mini-card-sub" style={{ color: i === 0 ? 'var(--yellow)' : 'var(--text-muted)' }}>{i === 0 ? '★ Best' : `#${i + 1}`}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════ TRAINING PLAN TAB ════════════ */}
        {activeTab === 'training' && (
          <>
            <div className="section">
              <SectionHeader title="Lộ Trình Bài Tập 3 Ngày" />

              {/* Playstyle + Pro Context */}
              {(ai.playstyleType || ai.proPlayerMatch) && (
                <div className="tracker-score-bar" style={{ marginBottom: '20px' }}>
                  {ai.playstyleType && (
                    <div className="trs-block">
                      <div className="trs-label">Phong Cách</div>
                      <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1rem', marginTop: '4px' }}>{ai.playstyleType}</div>
                    </div>
                  )}
                  {ai.proPlayerMatch && (
                    <div className="trs-block">
                      <div className="trs-label">Hình Mẫu Pro</div>
                      <div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '1rem', marginTop: '4px' }}>⚡ {ai.proPlayerMatch}</div>
                    </div>
                  )}
                  {ai.overallRating && (
                    <div className="trs-block">
                      <div className="trs-label">AI Score</div>
                      <div className="trs-score" style={{ color: ratingColor(ai.overallRating) }}>{ai.overallRating}</div>
                      <span className={`trs-grade ${ratingGrade(ai.overallRating)}`}>{ratingGrade(ai.overallRating)}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {(ai.trainingPlan || []).map((day) => (
                  <div key={day.day} className="training-day">
                    <div className="training-day-header">
                      <div className="day-number">{day.day}</div>
                      <div className="day-focus">{day.focus}</div>
                      <span className="badge badge-red" style={{ marginLeft: 'auto' }}>Day {day.day}</span>
                    </div>

                    {(day.tasks || []).map((task, i) => {
                      if (typeof task === 'string') {
                        return (
                          <div key={i} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: '2px' }}>→</span>
                            <span style={{ color: 'var(--text)', lineHeight: 1.5 }}>{task}</span>
                          </div>
                        )
                      }
                      return (
                        <details key={i} className="task-accordion">
                          <summary>{task.name || 'Bài tập'}</summary>
                          <div className="task-accordion-body">
                            <div className="task-meta-row">
                              <span className="task-meta">👤 Agent: <strong>{task.agent || 'Any'}</strong></span>
                              <span className="task-meta">🎮 Mode: <strong>{task.mode || 'N/A'}</strong></span>
                              <span className="task-meta">⏱️ Time: <strong>{task.duration || 'N/A'}</strong></span>
                            </div>
                            {task.description && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{task.description}</p>
                            )}
                            {task.videoUrl && (
                              <a href={task.videoUrl} target="_blank" rel="noreferrer" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                color: '#fff', background: 'var(--red)', fontWeight: 700, fontSize: '0.75rem',
                                textDecoration: 'none', padding: '6px 12px', borderRadius: '4px',
                              }}>
                                ▶ Xem Video Minh Họa
                              </a>
                            )}
                          </div>
                        </details>
                      )
                    })}
                  </div>
                ))}

                {(!ai.trainingPlan || ai.trainingPlan.length === 0) && (
                  <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
                    Chưa có lộ trình. Dùng <strong style={{ color: 'var(--red)' }}>/coach</strong> để tạo báo cáo!
                  </div>
                )}
              </div>
            </div>

            {/* Pro Reason */}
            {ai.proPlayerReason && (
              <div className="section">
                <SectionHeader title="Vì Sao Giống Pro Này?" />
                <div className="ai-card">
                  <p className="ai-quote">"{ai.proPlayerReason}"</p>
                  <div className="ai-attribution">
                    <span>⚡</span> AI Analysis · {ai.proPlayerMatch || 'Pro Archetype'}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          Báo cáo cập nhật mỗi khi bạn dùng <strong style={{ color: 'var(--red)' }}>/coach</strong> trên Discord
          <span className="sep-dot">·</span>
          Valorant AI Coach System
        </div>

      </div>
    </>
  )
}

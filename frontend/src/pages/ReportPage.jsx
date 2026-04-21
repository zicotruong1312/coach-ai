import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import '../index.css'

const API = import.meta.env.VITE_API_URL || 'https://coach-ai-l2ks.onrender.com'

/* ─── Helpers ─── */
const ratingColor = (r) => r >= 8 ? '#55efc4' : r >= 5 ? '#ffeaa7' : '#ff6b6b'

const agentIcons = {
  Jett: '🌪️', Reyna: '👁️', Sage: '🌿', Sova: '🏹', Brimstone: '🔥',
  Phoenix: '🔥', Raze: '💣', Breach: '💥', Omen: '🌑', Killjoy: '🤖',
  Cypher: '🕵️', Skye: '🐺', Yoru: '🃏', Astra: '⭐', Viper: '☠️',
  Chamber: '🔫', Neon: '⚡', Fade: '🌙', Harbor: '🌊', Gekko: '🦎',
  Deadlock: '🔗', Iso: '🧱', Clove: '🍀', Vyse: '🕸️',
}

/* ─── Sub-components ─── */
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card fade-up" style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      animation: 'fadeUp 0.4s ease both',
      borderLeft: `3px solid ${color || 'var(--purple)'}`,
    }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '2rem', fontWeight: 900, color: color || 'var(--text)' }}>{value}</span>
      {sub && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sub}</span>}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: '1.1rem', fontWeight: 700, color: 'var(--purple-lt)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      display: 'flex', alignItems: 'center', gap: '8px',
      borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px'
    }}>
      {children}
    </h2>
  )
}

/* ─── Main Page ─── */
export default function ReportPage() {
  const { discordId } = useParams()
  const [report, setReport] = useState(null)
  const [error,  setError]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/report/${discordId}`)
      .then(r => { setReport(r.data); setLoading(false) })
      .catch(e => {
        setError(e.response?.data?.error || 'Không tìm thấy báo cáo.')
        setLoading(false)
      })
  }, [discordId])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)' }}>Đang tải báo cáo...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '24px' }}>
      <span style={{ fontSize: '4rem' }}>😔</span>
      <h2 style={{ color: 'var(--red)' }}>Chưa có báo cáo</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>{error}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Hãy dùng lệnh <strong style={{ color: 'var(--purple-lt)' }}>/coach</strong> trên Discord để tạo báo cáo!
      </p>
    </div>
  )

  const { stats, aiAnalysis, riotName, riotTag, lastUpdatedAt } = report
  const ai = aiAnalysis || {}
  const s  = stats     || {}

  const radarData = [
    { subject: 'AIM',        A: ai.radarScores?.aim        || 50 },
    { subject: 'GAMESENSE',  A: ai.radarScores?.gamesense  || 50 },
    { subject: 'SURVIVAL',   A: ai.radarScores?.survival   || 50 },
    { subject: 'SUPPORT',    A: ai.radarScores?.support    || 50 },
    { subject: 'AGGRESSION', A: ai.radarScores?.aggression || 50 },
  ]

  const matchHistory = (s.matchHistory || []).map((m, i) => ({
    name: `#${i + 1} ${m.map || ''}`,
    Kills: m.kills, Deaths: m.deaths, Assists: m.assists,
    HS: m.headshotPct,
  }))

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 80px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* ── HERO HEADER ── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #14142b 0%, #1e1040 100%)',
        borderColor: 'var(--purple)', animation: 'pulse-glow 3s ease-in-out infinite',
        display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 900, color: '#fff', flexShrink: 0,
        }}>
          {(riotName || '?')[0].toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.2 }}>
            <span className="gradient-text">{riotName}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '1.1rem' }}>#{riotTag}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Báo cáo dựa trên <strong style={{ color: 'var(--purple-lt)' }}>{s.matchCount || 0} trận</strong> gần nhất
            {' · '}
            Cập nhật: <strong style={{ color: 'var(--cyan)' }}>{new Date(lastUpdatedAt).toLocaleString('vi-VN')}</strong>
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3rem', fontWeight: 900,
            color: ratingColor(ai.overallRating || 5),
          }}>
            {ai.overallRating || '—'}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/10</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>OVERALL RATING</div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div>
        <SectionTitle>📊 Thống Kê Tổng Hợp</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          <StatCard icon="⚔️" label="K/D"      value={s.kd || '—'}              color="var(--purple)" />
          <StatCard icon="💀" label="Kills/Trận" value={s.avgKills || '—'}        color="var(--red)" />
          <StatCard icon="🎯" label="Headshot %"  value={`${s.avgHeadshotPct || 0}%`} color="var(--cyan)" />
          <StatCard icon="🤝" label="Assists/Trận" value={s.avgAssists || '—'}   color="var(--green)" />
          <StatCard icon="📦" label="Deaths/Trận" value={s.avgDeaths || '—'}      color="var(--orange)" />
          <StatCard icon="🗺️" label="Matches"    value={s.matchCount || 0}        color="var(--yellow)" />
        </div>
      </div>

      {/* ── MATCH HISTORY CHART ── */}
      {matchHistory.length > 0 && (
        <div>
          <SectionTitle>📈 Lịch Sử Trận Đấu</SectionTitle>
          <div className="card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={matchHistory} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                <Line type="monotone" dataKey="Kills"   stroke="var(--purple-lt)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Deaths"  stroke="var(--red)"       strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Assists"  stroke="var(--cyan)"      strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── RADAR + PLAYSTYLE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>

        {/* Radar Chart */}
        <div>
          <SectionTitle>🕸️ Năng Lực 5 Chiều</SectionTitle>
          <div className="card">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Bạn" dataKey="A" stroke="var(--purple)" fill="var(--purple)" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Playstyle + Pro Match */}
        <div>
          <SectionTitle>🌟 Phong Cách & Hình Mẫu</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ borderLeft: '3px solid var(--purple)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Phong cách</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--purple-lt)', marginTop: '4px' }}>{ai.playstyleType || '—'}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '8px' }}>{ai.playstyleDesc || ''}</p>
            </div>

            <div className="card" style={{ borderLeft: '3px solid var(--cyan)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hình mẫu Pro</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--cyan)', marginTop: '4px' }}>⚡ {ai.proPlayerMatch || '—'}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '8px' }}>{ai.proPlayerReason || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STRENGTHS & WEAKNESSES ── */}
      <div>
        <SectionTitle>💪 Điểm Mạnh & Điểm Yếu</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>

          <div className="card">
            <h3 style={{ color: 'var(--green)', marginBottom: '16px', fontWeight: 700 }}>✅ Điểm Mạnh</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(ai.strengths || []).map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green)', marginTop: '2px', flexShrink: 0 }}>▶</span>
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ color: 'var(--red)', marginBottom: '16px', fontWeight: 700 }}>⚠️ Điểm Cần Cải Thiện</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(ai.weaknesses || []).map((w, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--red)', marginTop: '2px', flexShrink: 0 }}>▶</span>
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── 3-DAY TRAINING PLAN ── */}
      <div>
        <SectionTitle>🗓️ Lộ Trình Bài Tập 3 Ngày</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {(ai.trainingPlan || []).map((day) => (
            <div key={day.day} className="card" style={{ borderTop: '3px solid var(--purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '1rem', color: '#fff', flexShrink: 0,
                }}>{day.day}</span>
                <span style={{ fontWeight: 700, color: 'var(--purple-lt)' }}>{day.focus}</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(day.tasks || []).map((task, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>→</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOP AGENTS & MAPS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        <div>
          <SectionTitle>🎮 Đặc Vụ Hay Dùng</SectionTitle>
          <div className="card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {(s.topAgents || []).map((agent, i) => (
              <div key={agent} style={{
                padding: '12px 20px', borderRadius: '8px',
                background: i === 0 ? 'var(--purple)' : 'var(--bg-card2)',
                border: '1px solid var(--border)', fontWeight: 700, fontSize: '0.95rem',
              }}>
                {agentIcons[agent] || '🎯'} {agent}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>🗺️ Map Thường Chơi</SectionTitle>
          <div className="card" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {(s.topMaps || []).map((map, i) => (
              <div key={map} style={{
                padding: '12px 20px', borderRadius: '8px',
                background: i === 0 ? 'rgba(0,206,201,0.2)' : 'var(--bg-card2)',
                border: '1px solid var(--border)', fontWeight: 700, fontSize: '0.95rem',
              }}>
                🗺️ {map}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI SUMMARY ── */}
      <div>
        <SectionTitle>🤖 Nhận Xét Từ AI Coach</SectionTitle>
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(108,92,231,0.1), rgba(0,206,201,0.05))',
          borderColor: 'var(--purple)', position: 'relative', overflow: 'hidden',
        }}>
          <span style={{ fontSize: '5rem', position: 'absolute', right: '20px', top: '10px', opacity: 0.05 }}>💬</span>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: 'var(--text)' }}>
            "{ai.summary || 'Không có nhận xét.'}"
          </p>
          <p style={{ color: 'var(--purple-lt)', fontSize: '0.875rem', marginTop: '16px', fontWeight: 700 }}>
            — Gemini AI Coach
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Báo cáo này cập nhật mỗi khi bạn dùng <strong style={{ color: 'var(--purple-lt)' }}>/coach</strong> trên Discord · Valorant AI Coach System
      </p>

    </div>
  )
}

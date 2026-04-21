import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import '../index.css'

const API = import.meta.env.VITE_API_URL || 'https://coach-ai-t2ks.onrender.com'

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
function StatCard({ icon, label, value, sub, color, trend }) {
  // trend > 0 ? xanh chữ, < 0 ? đỏ chữ
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const trendColor = isPositive ? 'var(--green)' : isNegative ? 'var(--red)' : 'var(--text-muted)';
  const trendArrow = isPositive ? '▲' : isNegative ? '▼' : '—';
  const displayTrend = trend ? `${trendArrow} ${Math.abs(trend)}` : null;

  return (
    <div className="card fade-up" style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      animation: 'fadeUp 0.4s ease both',
      borderLeft: `3px solid ${color || 'var(--purple)'}`,
      position: 'relative'
    }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '2rem', fontWeight: 900, color: color || 'var(--text)' }}>{value}</span>
      {sub && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sub}</span>}
      {displayTrend && (
        <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.85rem', fontWeight: 700, color: trendColor }}>
          {displayTrend}
        </div>
      )}
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
    { subject: 'AIM',           A: ai.radarScores?.aim          || 50 },
    { subject: 'MOVEMENT',      A: ai.radarScores?.movement      || 50 },
    { subject: 'ABILITY USAGE', A: ai.radarScores?.abilityUsage  || 50 },
    { subject: 'GAME SENSE',    A: ai.radarScores?.gameSense     || 50 },
    { subject: 'TEAM PLAY',     A: ai.radarScores?.teamPlay      || 50 },
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
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '1.1rem', fontWeight: 700, color: 'var(--purple-lt)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            display: 'flex', alignItems: 'center', gap: '8px',
            margin: 0, padding: 0, border: 'none'
          }}>
            📊 Thống Kê Tổng Hợp
          </h2>
          {s.matchCount > 5 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trend so với 5 trận trước</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          <StatCard icon="⚔️" label="K/D"      value={s.kd || '—'}              color="var(--purple)" trend={s.kdTrend} />
          <StatCard icon="💀" label="Kills/Trận" value={s.avgKills || '—'}        color="var(--red)" />
          <StatCard icon="🎯" label="Headshot %"  value={`${s.avgHeadshotPct || 0}%`} color="var(--cyan)" trend={s.hsTrend} />
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
              <ComposedChart data={matchHistory} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="Deaths" fill="var(--red)" stroke="var(--red)" fillOpacity={0.2} strokeWidth={2} />
                <Bar dataKey="Kills" barSize={20} fill="var(--purple-lt)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Assists" barSize={20} fill="var(--cyan)" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── RADAR + PLAYSTYLE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>

        {/* Radar Chart */}
        <div>
          <SectionTitle>🕸️ Năng Lực 5 Chiều</SectionTitle>
          <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name="Bạn" dataKey="A" stroke="var(--purple)" fill="var(--purple)" fillOpacity={0.4} strokeWidth={2.5} />
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

            <div className="card" style={{ borderLeft: '3px solid var(--green)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coach Yêu Cầu Pick</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                {(ai.recommendedAgents || []).map(agent => (
                  <span key={agent} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {agentIcons[agent] || '👤'} {agent}
                  </span>
                ))}
                {(!ai.recommendedAgents || ai.recommendedAgents.length === 0) && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Đang chờ nâng cấp dữ liệu...</span>
                )}
              </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {(ai.trainingPlan || []).map((day) => (
            <div key={day.day} className="card" style={{ borderTop: '3px solid var(--purple)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '1rem', color: '#fff', flexShrink: 0,
                }}>{day.day}</span>
                <span style={{ fontWeight: 800, color: 'var(--purple-lt)', fontSize: '1.1rem' }}>{day.focus}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(day.tasks || []).map((task, i) => {
                  // Hỗ trợ cả chuẩn cũ (string) và mới (object)
                  if (typeof task === 'string') {
                    return (
                      <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>→</span>
                        <span>{task}</span>
                      </div>
                    )
                  }
                  
                  // Chuẩn mới (Object) rendering dạng Accordion (details/summary)
                  return (
                    <details key={i} style={{
                      background: 'var(--bg-card2)', border: '1px solid var(--border)',
                      borderRadius: '8px', overflow: 'hidden'
                    }}>
                      <summary style={{
                        padding: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)'
                      }}>
                        <span style={{ color: 'var(--cyan)' }}>▶</span> {task.name || 'Bài tập'}
                      </summary>
                      <div style={{ padding: '0 12px 12px 32px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>👤 Agent: <span style={{color: 'var(--purple-lt)', fontWeight: 600}}>{task.agent || 'Any'}</span></span>
                          <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>🎮 Mode: <span style={{color: 'var(--cyan)', fontWeight: 600}}>{task.mode || 'N/A'}</span></span>
                          <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>⏱️ Time: <span style={{color: 'var(--green)', fontWeight: 600}}>{task.duration || 'N/A'}</span></span>
                        </div>
                        <p style={{ marginTop: '4px' }}>{task.description || ''}</p>
                        {task.videoUrl && (
                          <a href={task.videoUrl} target="_blank" rel="noreferrer" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            color: 'var(--red)', fontWeight: 700, textDecoration: 'none', marginTop: '4px',
                            padding: '6px 12px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '4px', alignSelf: 'flex-start'
                          }}>
                            ▶️ Xem Video Minh Họa
                          </a>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
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

import '../index.css'

export default function HomePage() {
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">🎯</div>
          CoachAI
        </div>
        <div className="navbar-spacer" />
        <div className="live-badge">Live</div>
      </nav>

      {/* Hero */}
      <div style={{
        minHeight: '92vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '40px 24px', gap: '0',
        background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(255,70,85,0.08) 0%, transparent 70%)',
      }}>

        {/* Badge */}
        <div className="badge badge-red" style={{ marginBottom: '24px', fontSize: '0.75rem', padding: '6px 14px' }}>
          ⚡ Valorant Performance Intelligence
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '20px', maxWidth: '720px' }}>
          <span className="gradient-text">Nâng Tầm</span>{' '}
          <span style={{ color: 'var(--text)' }}>Game Của Bạn</span>
        </h1>

        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '40px' }}>
          Hệ thống phân tích AI cá nhân hoá — theo dõi hiệu suất, xác định phong cách chơi,
          và nhận lộ trình luyện tập tuỳ chỉnh ngay trên Discord.
        </p>

        {/* Stats row */}
        <div className="stat-row fade-up" style={{ maxWidth: '560px', width: '100%', marginBottom: '40px', borderRadius: '10px' }}>
          <div className="stat-row-item">
            <div className="stat-row-label">Phân tích</div>
            <div className="stat-row-value" style={{ color: 'var(--red)' }}>AI</div>
            <div className="stat-row-sub">Gemini powered</div>
          </div>
          <div className="stat-row-item">
            <div className="stat-row-label">Response</div>
            <div className="stat-row-value" style={{ color: 'var(--teal)' }}>&lt;3s</div>
            <div className="stat-row-sub">Tốc độ báo cáo</div>
          </div>
          <div className="stat-row-item">
            <div className="stat-row-label">Tracking</div>
            <div className="stat-row-value">24/7</div>
            <div className="stat-row-sub">Auto update</div>
          </div>
          <div className="stat-row-item">
            <div className="stat-row-label">Platform</div>
            <div className="stat-row-value">Discord</div>
            <div className="stat-row-sub">Bot command</div>
          </div>
        </div>

        {/* How to */}
        <div className="card" style={{ maxWidth: '420px', textAlign: 'left', borderColor: 'rgba(255,70,85,0.2)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '14px' }}>
            💬 Cách sử dụng
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { step: '01', text: 'Nhập lệnh /coach trong Discord server' },
              { step: '02', text: 'Bot phân tích 20 trận gần nhất của bạn' },
              { step: '03', text: 'Nhận link báo cáo cá nhân hoá ngay lập tức' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--red-dim)', border: '1px solid var(--red)',
                  color: 'var(--red)', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{step}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingTop: '4px' }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Link báo cáo của bạn:</div>
            <code style={{ color: 'var(--teal)', fontSize: '0.8rem', fontWeight: 600 }}>
              /report/[Discord ID]
            </code>
          </div>
        </div>

      </div>
    </>
  )
}

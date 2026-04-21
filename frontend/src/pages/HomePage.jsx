import '../index.css'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '24px', gap: '24px'
    }}>
      <div style={{ fontSize: '64px' }}>🎯</div>
      <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900 }}>
        Valorant AI Coach
      </h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '480px', fontSize: '1.1rem' }}>
        Hệ thống phân tích và huấn luyện cá nhân hoá dành riêng cho bạn.
        Dùng lệnh <strong style={{ color: 'var(--purple-lt)' }}>/coach</strong> trên Discord
        để nhận báo cáo của bạn!
      </p>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'left' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          💡 Link báo cáo cá nhân của bạn sẽ có dạng:
        </p>
        <code style={{ color: 'var(--cyan)', fontSize: '0.875rem' }}>
          /report/[Discord ID của bạn]
        </code>
      </div>
    </div>
  )
}

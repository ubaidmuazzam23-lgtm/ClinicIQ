// FILE: clinicaliq/frontend/src/components/shared/Card.tsx

interface CardProps {
  t: any
  children: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
}

interface CardHeaderProps {
  t: any
  title: string
  sub?: string
  children?: React.ReactNode
}

export function Card({ t, children, style = {}, onClick }: CardProps) {
  return (
    <div onClick={onClick} style={{
      background: t.bgCard,
      border: `0.5px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadow,
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ t, title, sub, children }: CardHeaderProps) {
  return (
    <div style={{
      padding: "14px 20px",
      borderBottom: `0.5px solid ${t.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 1 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

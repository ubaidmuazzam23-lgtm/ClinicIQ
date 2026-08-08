// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/components/shared/Btn.tsx
// ─────────────────────────────────────────────────────────────

import type { Tokens } from './tokens'

interface BtnProps {
  t: any
  onClick?: () => void
  primary?: boolean
  danger?: boolean
  disabled?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
}

export default function Btn({ t, onClick, primary, danger, disabled = false, children, style = {}, size = 'md' }: BtnProps) {
  const heights = { sm: 28, md: 34, lg: 42 }
  const fontSizes = { sm: 12, md: 13, lg: 14 }
  const paddings = { sm: '0 10px', md: '0 14px', lg: '0 20px' }

  const bg = primary ? t.peach : danger ? '#B85B43' : t.bgCard
  const color = primary || danger ? '#fff' : t.text
  const border = primary ? t.peach : danger ? '#B85B43' : t.border

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         6,
        height:      heights[size],
        padding:     paddings[size],
        borderRadius: 7,
        fontSize:    fontSizes[size],
        fontWeight:  500,
        cursor:      disabled ? 'not-allowed' : 'pointer',
        border:      `0.5px solid ${border}`,
        background:  bg,
        color,
        opacity:     disabled ? 0.5 : 1,
        fontFamily:  "'DM Sans',sans-serif",
        transition:  'all 0.15s',
        flexShrink:  0,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
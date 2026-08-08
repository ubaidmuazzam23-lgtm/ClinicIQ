// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/components/shared/tokens.ts
// ─────────────────────────────────────────────────────────────

export function tokens(dark: boolean) {
    return dark ? {
      bg:        '#0a0a0a',
      bgAlt:     '#111111',
      bgCard:    '#141414',
      bgCard2:   '#1a1a1a',
      sidebar:   '#0d1f28',
      text:      '#F2F2F2',
      textMuted: 'rgba(242,242,242,0.5)',
      textFaint: 'rgba(242,242,242,0.25)',
      border:    'rgba(255,255,255,0.08)',
      border2:   'rgba(255,255,255,0.12)',
      peach:     '#D77A61',
      peachDeep: '#B85B43',
      peachSoft: 'rgba(215,122,97,0.15)',
      ok:        '#34c759',
      okSoft:    'rgba(52,199,89,0.12)',
      warnSoft:  'rgba(215,122,97,0.12)',
      shadow:    '0 1px 3px rgba(0,0,0,0.4)',
      shadowMd:  '0 4px 16px rgba(0,0,0,0.5)',
    } : {
      bg:        '#EFF1F3',
      bgAlt:     '#F6F7F8',
      bgCard:    '#FFFFFF',
      bgCard2:   '#FAFAFB',
      sidebar:   '#223843',
      text:      '#131F26',
      textMuted: '#4A5963',
      textFaint: '#7A8893',
      border:    '#E2E5E8',
      border2:   '#D0D5DA',
      peach:     '#D77A61',
      peachDeep: '#B85B43',
      peachSoft: '#F2D9CF',
      ok:        '#2a9d5c',
      okSoft:    '#e8f7ef',
      warnSoft:  '#FCEAE3',
      shadow:    '0 1px 2px rgba(19,31,38,0.04)',
      shadowMd:  '0 4px 14px rgba(19,31,38,0.08)',
    }
  }
  
  export type Tokens = ReturnType<typeof tokens>
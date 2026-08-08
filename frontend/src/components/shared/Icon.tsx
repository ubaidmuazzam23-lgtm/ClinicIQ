// ─────────────────────────────────────────────────────────────
// FILE: clinicaliq/frontend/src/components/shared/Icon.tsx
// ─────────────────────────────────────────────────────────────

export default function Icon({ name, size = 16 }: { name: string; size?: number }) {
    const p: Record<string, React.ReactNode> = {
      dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
      query:     <><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/></>,
      upload:    <><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></>,
      routing:   <><circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 6h6a4 4 0 0 1 4 4"/><path d="M7 18h6a4 4 0 0 0 4-4"/></>,
      report:    <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h6"/></>,
      chat:      <><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1.3 3.6A8 8 0 0 1 21 12Z"/></>,
      bell:      <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8Z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
      sparkle:   <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></>,
      sun:       <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/></>,
      moon:      <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
      logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
      file:      <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
      send:      <><path d="m22 2-7 20-4-9-9-4 20-7z"/></>,
      download:  <><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></>,
      check:     <><path d="m5 13 4 4 10-10"/></>,
      trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
      x:         <><path d="m6 6 12 12M6 18 18 6"/></>,
      alert:     <><path d="M12 3 2 21h20Z"/><path d="M12 10v5M12 18v.2"/></>,
      chevron:   <><path d="m6 9 6 6 6-6"/></>,
      eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
      plus:      <><path d="M12 5v14M5 12h14"/></>,
      filter:    <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
      calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {p[name] || null}
      </svg>
    )
  }
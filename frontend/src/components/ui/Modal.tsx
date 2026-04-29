import { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
}

export default function Modal({ title, onClose, children, width = 560 }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,53,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width, maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #DDE3EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1C2B3A' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6B7A8D', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

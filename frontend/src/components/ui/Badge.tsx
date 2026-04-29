const MAP = {
  ok:   { bg: '#DCFCE7', fg: '#15803D' },
  warn: { bg: '#FEF9C3', fg: '#A16207' },
  err:  { bg: '#FEE2E2', fg: '#B91C1C' },
  info: { bg: '#E8F2FB', fg: '#1A5C9A' },
}

type Variant = keyof typeof MAP

interface Props { variant?: Variant; children: React.ReactNode }

export default function Badge({ variant = 'ok', children }: Props) {
  const { bg, fg } = MAP[variant]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: bg, color: fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export function estadoOrdenVariant(estado: string): Variant {
  return estado === 'terminada' ? 'ok' : estado === 'en_proceso' ? 'warn' : estado === 'anulada' ? 'err' : 'info'
}

export function estadoMaquinaVariant(estado: string): Variant {
  return estado === 'disponible' ? 'ok' : estado === 'prestada' ? 'warn' : estado === 'fuera_de_servicio' ? 'err' : 'info'
}

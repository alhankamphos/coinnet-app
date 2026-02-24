const styles = {
  blue:    'bg-blue-100 text-blue-700',
  green:   'bg-emerald-100 text-emerald-700',
  yellow:  'bg-amber-100 text-amber-700',
  red:     'bg-red-100 text-red-700',
  gray:    'bg-slate-100 text-slate-600',
  purple:  'bg-purple-100 text-purple-700',
}

export default function Badge({ children, color = 'blue', className = '' }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[color]} ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    requested:      { label: 'Solicitada', color: 'blue' },
    accepted:       { label: 'Aceptada', color: 'purple' },
    sinpe_sent:     { label: 'SINPE Enviado', color: 'yellow' },
    proof_uploaded: { label: 'Comprobante Subido', color: 'yellow' },
    verified:       { label: 'Verificado', color: 'green' },
    completed:      { label: 'Completada ✓', color: 'green' },
    cancelled:      { label: 'Cancelada', color: 'gray' },
    disputed:       { label: 'En Disputa', color: 'red' },
    pending_review: { label: 'Revisión Pendiente', color: 'yellow' },
    active:         { label: 'Verificado ✓', color: 'green' },
    suspended:      { label: 'Suspendido', color: 'red' },
  }
  const { label, color } = map[status] || { label: status, color: 'gray' }
  return <Badge color={color}>{label}</Badge>
}

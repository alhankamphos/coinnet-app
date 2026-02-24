const STEPS = [
  { status: 'requested',      label: 'Solicitud enviada',    icon: '📤' },
  { status: 'accepted',       label: 'Negocio aceptó',       icon: '✅' },
  { status: 'sinpe_sent',     label: 'SINPE enviado',        icon: '💸' },
  { status: 'proof_uploaded', label: 'Comprobante subido',   icon: '📎' },
  { status: 'verified',       label: 'SINPE verificado',     icon: '🔍' },
  { status: 'completed',      label: '¡Efectivo entregado!', icon: '💵' },
]

const ORDER = ['requested', 'accepted', 'sinpe_sent', 'proof_uploaded', 'verified', 'completed']

export default function StatusTimeline({ status }) {
  const currentIndex = ORDER.indexOf(status)

  if (status === 'cancelled' || status === 'disputed') {
    return (
      <div className={`rounded-xl p-4 text-center font-semibold ${status === 'cancelled' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'}`}>
        {status === 'cancelled' ? '❌ Transacción cancelada' : '⚠️ Disputa abierta — Un administrador revisará'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {STEPS.map((step, idx) => {
        const done = idx < currentIndex
        const active = idx === currentIndex
        return (
          <div key={step.status} className={`flex items-center gap-3 p-3 rounded-xl transition-all
            ${active ? 'bg-blue-50 border border-blue-200' : done ? 'bg-slate-50' : 'opacity-40'}`}>
            <span className={`text-xl ${active ? 'animate-pulse' : ''}`}>{step.icon}</span>
            <span className={`text-sm font-medium ${active ? 'text-blue-700' : done ? 'text-slate-700' : 'text-slate-400'}`}>
              {step.label}
            </span>
            {done && <span className="ml-auto text-emerald-500 text-sm font-bold">✓</span>}
            {active && <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
          </div>
        )
      })}
    </div>
  )
}

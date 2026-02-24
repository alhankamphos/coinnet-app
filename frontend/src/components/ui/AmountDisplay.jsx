export function formatCRC(amount) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', minimumFractionDigits: 0 }).format(amount)
}

export default function AmountDisplay({ amount, showCommission = false }) {
  const commission = Math.round(amount * 0.05)
  const total = amount + commission

  if (!showCommission) {
    return <span className="font-bold text-slate-800">{formatCRC(amount)}</span>
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
      <div className="flex justify-between text-sm text-slate-600">
        <span>Monto solicitado</span>
        <span>{formatCRC(amount)}</span>
      </div>
      <div className="flex justify-between text-sm text-slate-600">
        <span>Comisión (5%)</span>
        <span>{formatCRC(commission)}</span>
      </div>
      <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2">
        <span>Total a enviar por SINPE</span>
        <span className="text-brand-700">{formatCRC(total)}</span>
      </div>
      <p className="text-xs text-slate-500">El negocio te entrega {formatCRC(amount)} en efectivo</p>
    </div>
  )
}

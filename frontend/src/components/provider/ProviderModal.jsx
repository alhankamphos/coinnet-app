import Button from '../ui/Button'
import { StatusBadge } from '../ui/Badge'
import AmountDisplay, { formatCRC } from '../ui/AmountDisplay'

export default function ProviderModal({ provider, amount, onConfirm, onClose, loading }) {
  if (!provider) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-xl">
            🏪
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800">{provider.business_name}</h2>
            <StatusBadge status={provider.verification_status} />
          </div>
        </div>

        {/* SINPE Info */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-4">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">Datos SINPE</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Número</span>
              <span className="font-bold text-slate-800 text-lg tracking-wider">{provider.sinpe_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Titular</span>
              <span className="font-semibold text-slate-700">{provider.sinpe_holder_name}</span>
            </div>
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="mb-5">
          <AmountDisplay amount={amount} showCommission />
        </div>

        {/* Details */}
        <div className="flex gap-4 text-sm text-slate-600 mb-5">
          {provider.distance_km !== null && provider.distance_km !== undefined && (
            <span>📍 {provider.distance_km < 1 ? `${Math.round(provider.distance_km * 1000)}m` : `${provider.distance_km.toFixed(1)}km`}</span>
          )}
          <span>⭐ {provider.reputation_score?.toFixed(1) || '5.0'}</span>
          <span>💼 {provider.total_transactions || 0} transacciones</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={onConfirm} loading={loading} className="flex-1">
            Confirmar y continuar
          </Button>
        </div>
      </div>
    </div>
  )
}

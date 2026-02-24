import { StatusBadge } from '../ui/Badge'
import { formatCRC } from '../ui/AmountDisplay'

export default function ProviderCard({ provider, onClick, amount }) {
  const commission = amount ? Math.round(amount * 0.05) : null
  const total = amount ? amount + commission : null

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer active:bg-slate-50 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 truncate">{provider.business_name}</h3>
            <StatusBadge status={provider.verification_status} />
          </div>

          {provider.address && (
            <p className="text-sm text-slate-500 truncate">{provider.address}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
            {provider.distance_km !== null && provider.distance_km !== undefined && (
              <span className="flex items-center gap-1">
                📍 {provider.distance_km < 1 ? `${Math.round(provider.distance_km * 1000)}m` : `${provider.distance_km.toFixed(1)}km`}
              </span>
            )}
            <span className="flex items-center gap-1">
              ⭐ {provider.reputation_score?.toFixed(1) || '5.0'}
            </span>
            {provider.declared_liquidity && (
              <span className="flex items-center gap-1 text-emerald-600">
                💵 Liquidez disponible
              </span>
            )}
          </div>
        </div>

        {total && (
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Total a enviar</p>
            <p className="font-bold text-brand-700">₡{total.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
}

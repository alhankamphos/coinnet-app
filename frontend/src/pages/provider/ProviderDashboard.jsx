import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCRC } from '../../components/ui/AmountDisplay'
import { providerService } from '../../services/providers'
import { transactionService } from '../../services/transactions'

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const [provider, setProvider] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [liquidityInput, setLiquidityInput] = useState('')

  const load = async () => {
    try {
      const [pRes, txRes] = await Promise.all([
        providerService.getMyProvider(),
        transactionService.getProviderPending(),
      ])
      setProvider(pRes.data)
      setPending(txRes.data)
    } catch (err) {
      if (err.response?.status === 404) navigate('/proveedor/setup')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleAvailability = async () => {
    if (!provider) return
    setToggling(true)
    try {
      const liquidity = liquidityInput ? parseFloat(liquidityInput) : null
      await providerService.setAvailability(provider.id, !provider.is_available, liquidity)
      await load()
    } finally {
      setToggling(false)
    }
  }

  if (loading) return (
    <Layout title="Mi Panel">
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  return (
    <Layout title="Mi Panel">
      <div className="p-5 space-y-5">
        {/* Estado del negocio */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg text-slate-800">{provider?.business_name}</h2>
              <StatusBadge status={provider?.verification_status} />
            </div>
            <div className={`w-4 h-4 rounded-full mt-1 ${provider?.is_available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Transacciones', value: provider?.total_transactions || 0 },
              { label: 'Reputación', value: `${provider?.reputation_score?.toFixed(1) || '5.0'} ⭐` },
              { label: 'Solicitudes', value: pending.length },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-slate-50 rounded-xl py-3">
                <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Liquidez */}
          {provider?.is_available ? null : (
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Liquidez disponible (opcional, ₡)
              </label>
              <input
                type="number"
                placeholder="Ej: 50000"
                value={liquidityInput}
                onChange={(e) => setLiquidityInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          )}

          <Button
            size="lg"
            variant={provider?.is_available ? 'danger' : 'success'}
            loading={toggling}
            onClick={toggleAvailability}
          >
            {provider?.is_available ? '🔴 Desactivar disponibilidad' : '🟢 Activar disponibilidad'}
          </Button>
        </Card>

        {/* Solicitudes activas */}
        {pending.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">
              Solicitudes activas ({pending.length})
            </h3>
            <div className="space-y-3">
              {pending.slice(0, 5).map((tx) => (
                <Card key={tx.id} onClick={() => navigate(`/proveedor/solicitudes`)} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{formatCRC(tx.requested_amount)}</p>
                      <p className="text-xs text-slate-500 font-mono">{tx.transaction_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 font-bold text-sm">+{formatCRC(tx.commission_amount)}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </Card>
              ))}
              <Button variant="ghost" size="md" className="w-full" onClick={() => navigate('/proveedor/solicitudes')}>
                Ver todas las solicitudes →
              </Button>
            </div>
          </div>
        )}

        {/* Aviso verificación */}
        {provider?.verification_status === 'pending_review' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="font-semibold text-amber-800 text-sm">⏳ Verificación pendiente</p>
            <p className="text-amber-600 text-xs mt-1">
              Tu negocio está activo pero aún no verificado. Un administrador revisará tu perfil pronto.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

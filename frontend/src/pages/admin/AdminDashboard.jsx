import { useState, useEffect } from 'react'
import Layout from '../../components/ui/Layout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCRC } from '../../components/ui/AmountDisplay'
import api from '../../services/api'

function MetricBox({ icon, label, value, color = 'text-slate-800' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('metrics')
  const [actionLoading, setActionLoading] = useState({})

  const loadData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/providers'),
      ])
      setMetrics(mRes.data)
      setProviders(pRes.data)
    } catch (console.error)
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const doAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await api.patch(`/admin/providers/${id}/${action}`)
      await loadData()
    } catch (console.error)
    finally { setActionLoading((prev) => ({ ...prev, [id]: false })) }
  }

  return (
    <Layout title="Panel Admin" hideNav>
      <div className="p-5 space-y-5">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {['metrics', 'proveedores'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${tab === t ? 'bg-white shadow text-brand-700' : 'text-slate-500'}`}
            >
              {t === 'metrics' ? '📊 Métricas' : '🏪 Proveedores'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'metrics' && metrics ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MetricBox icon="👥" label="Usuarios" value={metrics.users.total} />
              <MetricBox icon="🏪" label="Proveedores" value={metrics.providers.total} />
              <MetricBox icon="✅" label="Verificados" value={metrics.providers.verified} color="text-emerald-600" />
              <MetricBox icon="⏳" label="Pendientes" value={metrics.providers.pending_review} color="text-amber-600" />
              <MetricBox icon="💸" label="Transacciones" value={metrics.transactions.total} />
              <MetricBox icon="⚠️" label="Disputas" value={metrics.transactions.disputed} color="text-red-600" />
            </div>

            <Card className="p-4">
              <p className="text-sm font-semibold text-slate-600 mb-3">Volumen acumulado</p>
              <p className="text-2xl font-bold text-brand-700">
                {formatCRC(metrics.volume.total_colones)}
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                Comisiones: {formatCRC(metrics.volume.total_commission)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Tasa de disputas: {metrics.transactions.dispute_rate_pct}%
              </p>
            </Card>
          </>
        ) : tab === 'proveedores' ? (
          <div className="space-y-3">
            {providers.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{p.business_name}</p>
                    <p className="text-sm text-slate-500">{p.sinpe_number} • {p.sinpe_holder_name}</p>
                    <p className="text-xs text-slate-400">{p.bank_email}</p>
                  </div>
                  <StatusBadge status={p.verification_status} />
                </div>
                <div className="flex gap-2">
                  {p.verification_status !== 'active' && (
                    <Button
                      size="sm"
                      variant="success"
                      loading={actionLoading[p.id]}
                      onClick={() => doAction(p.id, 'verify')}
                    >
                      ✅ Verificar
                    </Button>
                  )}
                  {p.verification_status !== 'suspended' && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={actionLoading[p.id]}
                      onClick={() => doAction(p.id, 'suspend')}
                    >
                      🚫 Suspender
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </Layout>
  )
}

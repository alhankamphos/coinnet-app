import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCRC } from '../../components/ui/AmountDisplay'
import { transactionService } from '../../services/transactions'

const ACTION_MAP = {
  requested: { label: 'Aceptar solicitud', action: 'accept', variant: 'primary', emoji: '✅' },
  accepted: { label: 'Esperando SINPE del usuario...', action: null, variant: 'secondary', emoji: '⏳' },
  sinpe_sent: { label: 'Usuario dice que envió el SINPE — Revisar correo del banco', action: null, variant: 'secondary', emoji: '📧' },
  proof_uploaded: { label: 'Confirmar recepción del SINPE', action: 'verify', variant: 'primary', emoji: '🔍' },
  verified: { label: 'Marcar efectivo entregado', action: 'complete', variant: 'success', emoji: '💵' },
}

function RequestCard({ tx, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const actionInfo = ACTION_MAP[tx.status]

  const doAction = async () => {
    if (!actionInfo?.action) return
    setLoading(true)
    setError('')
    try {
      if (actionInfo.action === 'accept') await transactionService.accept(tx.id)
      if (actionInfo.action === 'verify') await transactionService.verify(tx.id)
      if (actionInfo.action === 'complete') await transactionService.complete(tx.id)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono text-slate-400">{tx.transaction_code}</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{formatCRC(tx.requested_amount)}</p>
          <p className="text-sm text-emerald-600 font-semibold">Tu comisión: {formatCRC(tx.commission_amount)}</p>
        </div>
        <StatusBadge status={tx.status} />
      </div>

      {tx.proof_url && (
        <a href={tx.proof_url} target="_blank" rel="noreferrer"
           className="flex items-center gap-2 text-sm text-brand-700 bg-blue-50 px-3 py-2 rounded-lg">
          📎 Ver comprobante del usuario
        </a>
      )}

      {actionInfo && (
        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
          {actionInfo.emoji} {actionInfo.label}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2">
        {actionInfo?.action && (
          <Button size="md" variant={actionInfo.variant} onClick={doAction} loading={loading} className="flex-1">
            {actionInfo.emoji} {actionInfo.label}
          </Button>
        )}
        {tx.status === 'requested' && (
          <Button
            size="md"
            variant="ghost"
            className="text-red-500"
            onClick={async () => {
              setLoading(true)
              try { await transactionService.cancel(tx.id); onRefresh() }
              catch (e) { setError(e.response?.data?.detail || 'Error') }
              finally { setLoading(false) }
            }}
            loading={loading}
          >
            Rechazar
          </Button>
        )}
      </div>
    </Card>
  )
}

export default function ProviderRequests() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await transactionService.getProviderPending()
      setTransactions(res.data)
    } catch (console.error) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Layout title="Solicitudes activas" showBack>
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">📥</div>
            <p className="font-medium">Sin solicitudes activas</p>
            <p className="text-sm mt-1">Activa tu disponibilidad para recibir solicitudes</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <RequestCard key={tx.id} tx={tx} onRefresh={load} />
          ))
        )}
      </div>
    </Layout>
  )
}

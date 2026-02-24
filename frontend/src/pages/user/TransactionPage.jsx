import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import Button from '../../components/ui/Button'
import StatusTimeline from '../../components/transaction/StatusTimeline'
import { StatusBadge } from '../../components/ui/Badge'
import AmountDisplay, { formatCRC } from '../../components/ui/AmountDisplay'
import { transactionService } from '../../services/transactions'

export default function TransactionPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tx, setTx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()
  const pollRef = useRef()

  const loadTx = async () => {
    try {
      const res = await transactionService.getById(id)
      setTx(res.data)
    } catch {
      setError('No se pudo cargar la transacción')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTx()
    pollRef.current = setInterval(loadTx, 8000)
    return () => clearInterval(pollRef.current)
  }, [id])

  const isUser = tx?.user_id === user?.id
  const isProvider = user?.account_type === 'provider_business'

  const action = async (fn, label) => {
    setActionLoading(true)
    setError('')
    try {
      await fn()
      await loadTx()
    } catch (err) {
      setError(err.response?.data?.detail || `Error al ${label}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadProof = async () => {
    if (!file) return
    await action(async () => {
      await transactionService.uploadProof(id, file)
      setFile(null)
    }, 'subir comprobante')
  }

  if (loading) return (
    <Layout showBack title="Transacción">
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  if (!tx) return (
    <Layout showBack title="Transacción">
      <div className="p-5 text-center text-slate-500">{error || 'Transacción no encontrada'}</div>
    </Layout>
  )

  return (
    <Layout showBack title={tx.transaction_code}>
      <div className="p-5 space-y-5">
        {/* Estado */}
        <div className="flex items-center justify-between">
          <StatusBadge status={tx.status} />
          <span className="text-xs text-slate-400">
            {new Date(tx.created_at).toLocaleDateString('es-CR')}
          </span>
        </div>

        {/* SINPE info */}
        {tx.sinpe_number && (
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase mb-2">Datos del SINPE</p>
            <p className="text-xl font-bold tracking-wider text-slate-800">{tx.sinpe_number}</p>
            <p className="text-sm text-slate-600">{tx.sinpe_holder_name}</p>
            {tx.provider_name && <p className="text-xs text-slate-400 mt-1">{tx.provider_name}</p>}
          </div>
        )}

        {/* Monto */}
        <AmountDisplay amount={tx.requested_amount} showCommission />

        {/* Timeline */}
        <StatusTimeline status={tx.status} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>
        )}

        {/* ACCIONES según estado y rol */}
        <div className="space-y-3">
          {/* Usuario: marcar SINPE enviado */}
          {isUser && tx.status === 'accepted' && (
            <Button size="lg" onClick={() => action(() => transactionService.markSinpeSent(id), 'marcar envío')} loading={actionLoading}>
              💸 Marqué el SINPE como enviado
            </Button>
          )}

          {/* Usuario: subir comprobante */}
          {isUser && (tx.status === 'sinpe_sent' || tx.status === 'accepted') && (
            <div className="space-y-3">
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-400 transition-colors"
              >
                {file ? (
                  <div>
                    <p className="text-emerald-600 font-medium">✓ {file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Toca para cambiar</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl mb-2">📎</p>
                    <p className="text-sm font-medium text-slate-600">Subir comprobante</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG o PDF</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file && (
                <Button size="lg" onClick={handleUploadProof} loading={actionLoading}>
                  📤 Enviar comprobante
                </Button>
              )}
            </div>
          )}

          {/* Ruta al negocio cuando está listo para ir */}
          {isUser && ['proof_uploaded', 'verified', 'completed'].includes(tx.status) && (
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="font-semibold text-emerald-800 mb-3">
                {tx.status === 'completed' ? '🎉 ¡Transacción completada!' : '✅ Dirígete al negocio'}
              </p>
              <div className="flex gap-2">
                <a
                  href={`https://waze.com/ul?ll=${tx.provider_lat},${tx.provider_lng}&navigate=yes`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
                >
                  🗺 Waze
                </a>
                <a
                  href={`https://maps.google.com/?q=${tx.provider_lat},${tx.provider_lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-2 bg-slate-700 text-white rounded-xl text-sm font-semibold"
                >
                  📍 Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Cancelar */}
          {!['completed', 'cancelled', 'disputed'].includes(tx.status) && (
            <Button
              variant="ghost"
              size="md"
              className="w-full text-red-500 hover:bg-red-50"
              onClick={() => action(() => transactionService.cancel(id), 'cancelar')}
              loading={actionLoading}
            >
              Cancelar transacción
            </Button>
          )}

          {/* Disputa */}
          {['sinpe_sent', 'proof_uploaded', 'verified'].includes(tx.status) && isUser && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-orange-500"
              onClick={() => {
                const reason = prompt('Describe el problema:')
                if (reason) action(() => transactionService.dispute(id, reason), 'abrir disputa')
              }}
            >
              ⚠️ Reportar problema
            </Button>
          )}
        </div>

        {/* Comprobante subido */}
        {tx.proof_url && (
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-2">Comprobante subido</p>
            <a href={tx.proof_url} target="_blank" rel="noreferrer" className="text-brand-700 text-sm font-medium underline">
              Ver comprobante →
            </a>
          </div>
        )}
      </div>
    </Layout>
  )
}

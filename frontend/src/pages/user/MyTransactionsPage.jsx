import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCRC } from '../../components/ui/AmountDisplay'
import { transactionService } from '../../services/transactions'

export default function MyTransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    transactionService.getMy()
      .then((res) => setTransactions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Mis transacciones">
      <div className="p-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">Sin transacciones todavía</p>
            <p className="text-sm mt-1">Tus transacciones aparecerán aquí</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <Card key={tx.id} onClick={() => navigate(`/transaccion/${tx.id}`)} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-mono">{tx.transaction_code}</p>
                  <p className="font-bold text-slate-800 mt-1">{formatCRC(tx.requested_amount)}</p>
                  {tx.provider_name && (
                    <p className="text-sm text-slate-500">{tx.provider_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <StatusBadge status={tx.status} />
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(tx.created_at).toLocaleDateString('es-CR')}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Layout>
  )
}

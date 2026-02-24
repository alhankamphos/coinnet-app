import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ProviderCard from '../../components/provider/ProviderCard'
import ProviderModal from '../../components/provider/ProviderModal'
import { useLocation } from '../../hooks/useLocation'
import { providerService } from '../../services/providers'
import { transactionService } from '../../services/transactions'

export default function SearchPage() {
  const navigate = useNavigate()
  const { location, error: locError, loading: locLoading, requestLocation } = useLocation()
  const [amount, setAmount] = useState('')
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    requestLocation()
  }, [])

  const handleSearch = async () => {
    if (!amount || parseFloat(amount) < 1000) {
      setError('El monto mínimo es ₡1,000')
      return
    }
    if (!location) {
      setError('Necesitamos tu ubicación para buscar negocios cercanos')
      requestLocation()
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await providerService.getNearby(location.lat, location.lng, parseFloat(amount))
      setProviders(res.data.providers)
      setSearched(true)
    } catch {
      setError('Error al buscar negocios. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedProvider) return
    setCreating(true)
    try {
      const res = await transactionService.create(selectedProvider.id, parseFloat(amount))
      navigate(`/transaccion/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear transacción')
      setSelectedProvider(null)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Layout title="Buscar efectivo" showBack>
      <div className="p-5 space-y-5">
        {/* Ubicación */}
        {!location && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Ubicación necesaria</p>
              <p className="text-amber-600 text-xs mt-0.5">
                {locError || 'Para encontrar negocios cercanos, necesitamos tu ubicación.'}
              </p>
              <button onClick={requestLocation} className="text-amber-700 font-semibold text-sm mt-2 underline">
                {locLoading ? 'Obteniendo...' : 'Permitir ubicación'}
              </button>
            </div>
          </div>
        )}

        {location && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
            <span>✅</span>
            <span>Ubicación obtenida</span>
          </div>
        )}

        {/* Input monto */}
        <div>
          <Input
            label="¿Cuánto efectivo necesitas?"
            type="number"
            placeholder="10000"
            prefix="₡"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1000"
            error={error}
          />
          {amount && parseFloat(amount) >= 1000 && (
            <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Total a enviar por SINPE: <strong className="text-brand-700">₡{Math.round(parseFloat(amount) * 1.05).toLocaleString()}</strong>
              <span className="ml-1">(incluye 5% comisión)</span>
            </div>
          )}
        </div>

        <Button size="lg" loading={loading || locLoading} onClick={handleSearch}>
          🔍 Buscar negocios cercanos
        </Button>

        {/* Resultados */}
        {searched && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">
                {providers.length > 0 ? `${providers.length} negocios disponibles` : 'Sin resultados'}
              </h3>
              {providers.length > 0 && (
                <span className="text-xs text-slate-400">Ordenados por distancia</span>
              )}
            </div>

            {providers.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium">No hay negocios disponibles</p>
                <p className="text-sm mt-1">No encontramos negocios activos en 5km</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    amount={parseFloat(amount)}
                    onClick={() => setSelectedProvider(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal confirmación */}
      {selectedProvider && (
        <ProviderModal
          provider={selectedProvider}
          amount={parseFloat(amount)}
          onConfirm={handleConfirm}
          onClose={() => setSelectedProvider(null)}
          loading={creating}
        />
      )}
    </Layout>
  )
}

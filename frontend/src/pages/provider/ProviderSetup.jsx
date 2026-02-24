import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { providerService } from '../../services/providers'
import { useLocation } from '../../hooks/useLocation'

export default function ProviderSetup() {
  const navigate = useNavigate()
  const { location, requestLocation } = useLocation()
  const [form, setForm] = useState({
    business_name: '', sinpe_number: '', sinpe_holder_name: '',
    bank_email: '', address: '', description: '',
    latitude: '', longitude: '', min_amount: 1000, max_amount: 100000,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { requestLocation() }, [])
  useEffect(() => {
    if (location) setForm((f) => ({ ...f, latitude: location.lat, longitude: location.lng }))
  }, [location])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.latitude || !form.longitude) {
      setError('La ubicación GPS es obligatoria')
      return
    }
    setLoading(true)
    setError('')
    try {
      await providerService.create({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        min_amount: parseFloat(form.min_amount),
        max_amount: parseFloat(form.max_amount),
      })
      navigate('/proveedor/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout hideNav title="Configura tu negocio">
      <div className="p-5 space-y-5">
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-sm text-blue-700">Completa tu perfil para comenzar a recibir solicitudes de efectivo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre del negocio" placeholder="Minisuper El Central" value={form.business_name} onChange={set('business_name')} required />
          <Input label="Número SINPE" placeholder="88880000" value={form.sinpe_number} onChange={set('sinpe_number')} required />
          <Input label="Nombre del titular SINPE" placeholder="Juan Pérez Rodríguez" value={form.sinpe_holder_name} onChange={set('sinpe_holder_name')} required />
          <Input label="Correo del banco (donde recibes confirmaciones)" type="email" placeholder="tucorreo@bncr.fi.cr" value={form.bank_email} onChange={set('bank_email')} required />
          <Input label="Dirección (opcional)" placeholder="100m norte del parque" value={form.address} onChange={set('address')} />
          <Input label="Descripción (opcional)" placeholder="Minisuper abierto 7am a 10pm" value={form.description} onChange={set('description')} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto mínimo (₡)" type="number" value={form.min_amount} onChange={set('min_amount')} min="500" />
            <Input label="Monto máximo (₡)" type="number" value={form.max_amount} onChange={set('max_amount')} min="1000" />
          </div>

          {/* Ubicación */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Ubicación GPS</p>
            {location ? (
              <p className="text-sm text-emerald-600">✅ Ubicación obtenida: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
            ) : (
              <button type="button" onClick={requestLocation} className="text-brand-700 text-sm font-semibold underline">
                📍 Usar mi ubicación actual
              </button>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Input label="Latitud" type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="9.9340" />
              <Input label="Longitud" type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="-84.0877" />
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>}

          <Button type="submit" size="lg" loading={loading}>
            Crear perfil de negocio
          </Button>
        </form>
      </div>
    </Layout>
  )
}

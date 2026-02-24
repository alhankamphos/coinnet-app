import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    account_type: 'user'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const user = await register(form)
      if (user.account_type === 'provider_business') {
        navigate('/proveedor/setup')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
            🔵
          </div>
          <h1 className="text-xl font-bold text-brand-700">Crear cuenta</h1>
        </div>

        {/* Tipo de cuenta */}
        <div className="grid grid-cols-2 gap-2 mb-5 bg-slate-100 p-1 rounded-xl">
          {[
            { value: 'user', label: '👤 Usuario', desc: 'Necesito efectivo' },
            { value: 'provider_business', label: '🏪 Negocio', desc: 'Ofrezco liquidez' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, account_type: opt.value })}
              className={`py-2 px-3 rounded-lg text-center transition-all
                ${form.account_type === opt.value ? 'bg-white shadow text-brand-700 font-semibold' : 'text-slate-500'}`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nombre completo" placeholder="Juan Pérez" value={form.full_name} onChange={set('full_name')} required />
          <Input label="Correo electrónico" type="email" placeholder="tucorreo@ejemplo.com" value={form.email} onChange={set('email')} required />
          <Input label="Teléfono (opcional)" type="tel" placeholder="88880000" value={form.phone} onChange={set('phone')} />
          <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} required />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>
          )}

          <Button type="submit" size="lg" loading={loading}>
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

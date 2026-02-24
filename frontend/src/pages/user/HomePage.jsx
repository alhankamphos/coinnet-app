import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/ui/Layout'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const isProvider = user?.account_type === 'provider_business'

  return (
    <Layout>
      <div className="p-5 space-y-6">
        {/* Saludo */}
        <div className="pt-2">
          <h2 className="text-2xl font-bold text-slate-800">
            Hola, {user?.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500 mt-1">
            {isProvider ? 'Gestiona tu disponibilidad y solicitudes' : '¿Necesitas efectivo hoy?'}
          </p>
        </div>

        {/* CTA principal */}
        {!isProvider ? (
          <Card className="bg-gradient-to-br from-brand-700 to-brand-800 border-0 p-6">
            <p className="text-blue-100 text-sm mb-2">Encuentra efectivo cerca de ti</p>
            <h3 className="text-white text-xl font-bold mb-4">Solicitar efectivo ahora</h3>
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-brand-700 border-0 hover:bg-blue-50"
              onClick={() => navigate('/buscar')}
            >
              🔍 Buscar negocio cercano
            </Button>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-0 p-6">
            <p className="text-emerald-100 text-sm mb-2">Panel de proveedor</p>
            <h3 className="text-white text-xl font-bold mb-4">Gestiona tu negocio</h3>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 bg-white text-emerald-700 border-0"
                onClick={() => navigate('/proveedor/dashboard')}
              >
                📊 Mi panel
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1 bg-white text-emerald-700 border-0"
                onClick={() => navigate('/proveedor/solicitudes')}
              >
                📥 Solicitudes
              </Button>
            </div>
          </Card>
        )}

        {/* Cómo funciona */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-3">¿Cómo funciona?</h3>
          <div className="space-y-3">
            {[
              { icon: '📍', title: 'Ubícate', desc: 'Permitimos acceder a tu ubicación para encontrar negocios cercanos' },
              { icon: '💰', title: 'Indica el monto', desc: 'Escribe cuánto efectivo necesitas' },
              { icon: '🏪', title: 'Elige un negocio', desc: 'Selecciona el negocio que más te convenga' },
              { icon: '📱', title: 'Envía por SINPE', desc: 'Transfiere el monto más el 5% de comisión' },
              { icon: '💵', title: 'Recibe el efectivo', desc: 'Ve al negocio y recibe tu dinero' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-2xl">{step.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-slate-800">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historial rápido */}
        <Button variant="ghost" size="md" className="w-full" onClick={() => navigate('/mis-transacciones')}>
          Ver mis transacciones →
        </Button>
      </div>
    </Layout>
  )
}

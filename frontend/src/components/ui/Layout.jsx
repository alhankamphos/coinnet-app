import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function NavItem({ icon, label, path, active }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors
        ${active ? 'text-brand-700' : 'text-slate-400'}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

export default function Layout({ children, title, showBack = false, hideNav = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isProvider = user?.account_type === 'provider_business'
  const isAdmin = user?.account_type === 'superadmin'

  const userNav = [
    { icon: '🏠', label: 'Inicio', path: '/' },
    { icon: '🔍', label: 'Buscar', path: '/buscar' },
    { icon: '📋', label: 'Historial', path: '/mis-transacciones' },
  ]

  const providerNav = [
    { icon: '📊', label: 'Panel', path: '/proveedor/dashboard' },
    { icon: '📥', label: 'Solicitudes', path: '/proveedor/solicitudes' },
    { icon: '🏠', label: 'Inicio', path: '/' },
  ]

  const navItems = isAdmin ? [] : isProvider ? providerNav : userNav

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          {showBack ? (
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:text-brand-700">
              ← Volver
            </button>
          ) : (
            <span className="text-lg font-bold text-brand-700">🔵 Coinnet</span>
          )}
          {title && <h1 className="text-base font-semibold text-slate-800">{title}</h1>}
          <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 px-2 py-1">
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      {!hideNav && navItems.length > 0 && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 flex justify-around px-2 py-1 safe-bottom z-20">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              active={location.pathname === item.path}
            />
          ))}
        </nav>
      )}
    </div>
  )
}

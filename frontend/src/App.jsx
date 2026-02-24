import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

// Pages - Auth
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Pages - User
import HomePage from './pages/user/HomePage'
import SearchPage from './pages/user/SearchPage'
import TransactionPage from './pages/user/TransactionPage'
import MyTransactionsPage from './pages/user/MyTransactionsPage'

// Pages - Provider
import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProviderSetup from './pages/provider/ProviderSetup'
import ProviderRequests from './pages/provider/ProviderRequests'

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard'

function ProtectedRoute({ children, allowedTypes }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedTypes && !allowedTypes.includes(user.account_type)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />

      {/* Usuario */}
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/buscar" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/transaccion/:id" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
      <Route path="/mis-transacciones" element={<ProtectedRoute><MyTransactionsPage /></ProtectedRoute>} />

      {/* Proveedor */}
      <Route path="/proveedor/setup" element={<ProtectedRoute allowedTypes={['provider_business', 'superadmin']}><ProviderSetup /></ProtectedRoute>} />
      <Route path="/proveedor/dashboard" element={<ProtectedRoute allowedTypes={['provider_business', 'superadmin']}><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/proveedor/solicitudes" element={<ProtectedRoute allowedTypes={['provider_business', 'superadmin']}><ProviderRequests /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedTypes={['superadmin']}><AdminDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

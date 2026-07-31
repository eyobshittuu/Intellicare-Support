import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'

// Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import CreateTicket from './pages/CreateTicket'
import Users from './pages/admin/Users'
import CreateAdmin from './pages/admin/CreateAdmin'
import SystemLogs from './pages/admin/SystemLogs'
import Performance from './pages/admin/Performance'
import Channels from './pages/admin/Channels'
import PendingRegistrations from './pages/admin/PendingRegistrations'
import Profile from './pages/Profile'
import Chat from './pages/Chat'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false, userOnly = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (superAdminOnly && user.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  if (adminOnly && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  if (userOnly && (user.role === 'admin' || user.role === 'super_admin')) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <SocketProvider>
        <NotificationProvider>
          <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route
              path="/tickets/new"
              element={
                <ProtectedRoute userOnly>
                  <CreateTicket />
                </ProtectedRoute>
              }
            />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Chat Route */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute adminOnly>
                  <Chat />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Only Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <Users />
                </ProtectedRoute>
              }
            />
            
            {/* Super Admin Only Routes */}
            <Route
              path="/channels"
              element={
                <ProtectedRoute superAdminOnly>
                  <Channels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/create-admin"
              element={
                <ProtectedRoute superAdminOnly>
                  <CreateAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <ProtectedRoute superAdminOnly>
                  <Performance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-logs"
              element={
                <ProtectedRoute superAdminOnly>
                  <SystemLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registrations"
              element={
                <ProtectedRoute superAdminOnly>
                  <PendingRegistrations />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </NotificationProvider>
      </SocketProvider>
    </Router>
  )
}

export default App

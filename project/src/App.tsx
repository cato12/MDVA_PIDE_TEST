/**
 * Punto de entrada principal de la aplicación React.
 * Gestiona rutas, autenticación y notificaciones globales.
 * @module App
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Layout } from './components/Layout/Layout';
import { TrabajadorDashboard } from './components/Dashboard/TrabajadorDashboard';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { UserManagement } from './components/Admin/UserManagement';
import { AuditLogs } from './components/Admin/AuditLogs';
import { RucSearch } from './components/Search/RucSearch';
import { DniSearch } from './components/Search/DniSearch';
import { ToastContainer } from './components/Toast/ToastContainer';

/**
 * Ruta protegida que requiere autenticación.
 * Si el usuario no está autenticado, redirige a login.
 * Si está cargando, muestra un spinner.
 * @param children Elementos hijos a renderizar si autenticado
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

/**
 * Define y organiza todas las rutas principales de la aplicación.
 * Redirige según el rol del usuario y protege rutas sensibles.
 */
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/dashboard" />} />
      
      {/* Rutas para Trabajadores */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {user?.rol === 'administrador' ? <Navigate to="/admin/dashboard" /> : <TrabajadorDashboard />}
        </ProtectedRoute>
      } />
      {user?.rol !== 'administrador' && (
        <Route path="/busqueda-ruc" element={
          <ProtectedRoute>
            <RucSearch />
          </ProtectedRoute>
        } />
      )}
      {user?.rol !== 'administrador' && (
        <Route path="/busqueda-dni" element={
          <ProtectedRoute>
            <DniSearch />
          </ProtectedRoute>
        } />
      )}

      {/* Rutas para Administradores */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          {user?.rol === 'administrador' ? <AdminDashboard /> : <Navigate to="/dashboard" />}
        </ProtectedRoute>
      } />
      <Route path="/admin/usuarios" element={
        <ProtectedRoute>
          {user?.rol === 'administrador' ? <UserManagement /> : <Navigate to="/dashboard" />}
        </ProtectedRoute>
      } />
      <Route path="/admin/logs" element={
        <ProtectedRoute>
          {user?.rol === 'administrador' ? <AuditLogs /> : <Navigate to="/dashboard" />}
        </ProtectedRoute>
      } />

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

/**
 * Componente raíz de la aplicación.
 * Envuelve la app con los providers globales y el router.
 */
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <ToastContainer />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

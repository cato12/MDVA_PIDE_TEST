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
import { useEffect, useState } from 'react';
import NetworkNotification from './components/NetworkNotification';
import { detectarDevtools } from './utils/devtoolsDetector';
import CopyBlocker from './components/CopyBlocker';
import DevtoolsWarning from './components/DevtoolsWarning';
import { useBackendStatus } from './hooks/useBackendStatus';
import MaintenanceModal from './components/MaintenanceModal';
import { useSessionValidation } from './hooks/useSessionValidation';
import MultipleSessionModal from './components/MultipleSessionModal';
import SessionValidator from './components/SessionValidator';

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

function App() {
  const [devtoolsDetected, setDevtoolsDetected] = useState(false);
  const isBackendOnline = useBackendStatus();

  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <SessionValidator />
          {/* {typeof isBackendOnline !== 'undefined' && (
            <div className="fixed bottom-4 left-4 bg-white px-3 py-2 shadow rounded text-sm z-[9999]">
              <strong>Backend:</strong> {isBackendOnline ? 'Online 🟢' : 'Offline 🔴'}
            </div>
          )} */}
          {isBackendOnline === false && <MaintenanceModal />}
          <AppWithAuth devtoolsDetected={devtoolsDetected} setDevtoolsDetected={setDevtoolsDetected} />
          <CopyBlocker />
          <ToastContainer />
          <NetworkNotification />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
  
}

interface AppWithAuthProps {
  devtoolsDetected: boolean;
  setDevtoolsDetected: (value: boolean) => void;
}

function AppWithAuth({ devtoolsDetected, setDevtoolsDetected }: AppWithAuthProps) {
  const { user } = useAuth();

  useEffect(() => {
    detectarDevtools(() => {
      setDevtoolsDetected(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setDevtoolsDetected(false);
    }
  }, [user]);
  return (
    <>
      {devtoolsDetected && !user && (
        <div className="fixed inset-0 bg-black bg-opacity-80 text-white z-[9999] flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">⚠️ Herramientas de inspección detectadas</h2>
            <p>No puedes interactuar con el sistema.</p>
            <p className="mt-4 text-sm">Este acceso está monitoreado.</p>
          </div>
        </div>
      )}

      <AppRoutes />
      {devtoolsDetected && user && <DevtoolsWarning />}
    </>
  );
}

export default App;

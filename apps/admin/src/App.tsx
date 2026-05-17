import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import ReceptionLayout from './layouts/ReceptionLayout';
import Servicios from './pages/Servicios';
import Promociones from './pages/Promociones';
import Usuarios from './pages/Usuarios';
import ConfiguracionPage from './pages/Configuracion';
import Dashboard from './pages/Dashboard';
import Recepcion from './pages/Recepcion';

const AuthGuard = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  
  if (!user || !profile || profile.is_active === false) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Admin */}
        <Route path="/admin" element={<AuthGuard allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="promociones" element={<Promociones />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>
        </Route>

        {/* Rutas Recepción */}
        <Route path="/recepcion" element={<AuthGuard allowedRoles={['admin', 'recepcion']} />}>
          <Route element={<ReceptionLayout />}>
            <Route index element={<Recepcion />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

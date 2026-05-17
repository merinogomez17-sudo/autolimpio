import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Droplets } from 'lucide-react';

const ReceptionLayout = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Top Header Simplificado */}
      <header className="h-16 bg-brand-primary text-white flex items-center justify-between px-6 shrink-0 shadow-md z-10">
        <div className="flex items-center gap-2">
          <Droplets size={24} weight="fill" />
          <span className="font-bold text-xl tracking-tight">Autolimpio Recepción</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm font-medium opacity-90 hidden sm:block">
            {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          <div className="flex items-center gap-4 border-l border-white/20 pl-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {profile?.full_name?.charAt(0) || 'R'}
              </div>
              <span className="text-sm font-medium hidden sm:block">{profile?.full_name}</span>
            </div>
            
            <button 
              onClick={signOut}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default ReceptionLayout;

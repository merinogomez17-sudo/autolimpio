import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, User, Appointment, PointHistory, Membership, Configuracion } from '@autolimpio/supabase';
import { Search, ChevronRight, X, Star, Calendar, History, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';

// Componente Drawer
const Drawer = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-white flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
};

const Usuarios = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'cliente')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as User[];
    }
  });

  const filteredUsers = users?.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary w-72"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Cargando clientes...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nivel</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Puntos Totales</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers?.map(user => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">Registrado el {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border inline-flex items-center gap-1 ${
                      user.nivel === 'oro' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      user.nivel === 'plata' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                      'bg-orange-50 text-orange-800 border-orange-200'
                    }`}>
                      <Star size={12} className={user.nivel === 'oro' ? 'fill-yellow-500 text-yellow-500' : ''} />
                      <span className="capitalize">{user.nivel}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-brand-primary">
                    {user.total_points} pts
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    <ChevronRight size={20} className="inline-block" />
                  </td>
                </tr>
              ))}
              {filteredUsers?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <Drawer 
          isOpen={!!selectedUser} 
          onClose={() => setSelectedUser(null)} 
          title="Detalle del Cliente"
        >
          <UserDetail user={selectedUser} onClose={() => setSelectedUser(null)} />
        </Drawer>
      )}
    </div>
  );
};

const UserDetail = ({ user, onClose }: { user: User, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'resumen' | 'visitas' | 'puntos'>('resumen');

  // Multi-queries
  const { data: config } = useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const { data } = await supabase.from('configuracion').select('*').limit(1).single();
      return data as Configuracion;
    }
  });

  const { data: memberships } = useQuery({
    queryKey: ['memberships'],
    queryFn: async () => {
      const { data } = await supabase.from('memberships').select('*');
      return data as Membership[];
    }
  });

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments', user.id],
    queryFn: async () => {
      // Necesitamos unir appointments con services
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Appointment & { service?: { name: string } })[];
    }
  });

  const { data: points, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['points', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PointHistory[];
    }
  });

  // Mutación de ajuste manual de puntos
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const adjustPointsMutation = useMutation({
    mutationFn: async (formData: any) => {
      const amount = Number(formData.amount);
      const newTotal = user.total_points + amount;

      // 1. Insert history
      const { error: historyError } = await supabase.from('points').insert({
        user_id: user.id,
        amount: amount,
        action: 'manual',
        description: formData.description
      });
      if (historyError) throw historyError;

      // 2. Update user points (and possibly level if backend doesn't have a trigger, 
      // but ideally we just update points and let a trigger/helper update level.
      // We will do both here to be safe and immediate).
      let newLevel = user.nivel;
      if (config) {
        if (newTotal >= config.puntos_para_oro) newLevel = 'oro';
        else if (newTotal >= config.puntos_para_plata) newLevel = 'plata';
        else newLevel = 'bronce';
      }

      const { error: userError } = await supabase.from('users').update({
        total_points: Math.max(0, newTotal),
        nivel: newLevel
      }).eq('id', user.id);
      
      if (userError) throw userError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['points', user.id] });
      reset();
      onClose(); // Cerrar drawer para refrescar vista completa
    }
  });

  // Cálculo progreso
  let nextLevelName = 'Ninguno';
  let minNext = 0;
  let maxNext = 1;
  let current = user.total_points;
  let progressPct = 100;

  if (config) {
    if (user.nivel === 'bronce') {
      nextLevelName = 'Plata';
      minNext = 0;
      maxNext = config.puntos_para_plata;
      progressPct = Math.min(100, (current / maxNext) * 100);
    } else if (user.nivel === 'plata') {
      nextLevelName = 'Oro';
      minNext = config.puntos_para_plata;
      maxNext = config.puntos_para_oro;
      progressPct = Math.min(100, ((current - minNext) / (maxNext - minNext)) * 100);
    } else {
      nextLevelName = 'Nivel Máximo';
      progressPct = 100;
    }
  }

  const currentMembership = memberships?.find(m => m.name.toLowerCase() === user.nivel.toLowerCase());

  return (
    <div className="flex flex-col h-full">
      {/* Header Info */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-2xl">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              user.full_name?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user.full_name}</h3>
            <p className="text-gray-500">{user.phone}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 pt-2 bg-white sticky top-0 z-10">
        <button 
          className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'resumen' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('resumen')}
        >
          Resumen
        </button>
        <button 
          className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'visitas' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('visitas')}
        >
          Historial de Visitas
        </button>
        <button 
          className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'puntos' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('puntos')}
        >
          Puntos
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Nivel Actual</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
                    <Star size={24} className={user.nivel === 'oro' ? 'fill-yellow-500 text-yellow-500' : 'text-brand-primary'} />
                    {user.nivel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium mb-1">Puntos Acumulados</p>
                  <p className="text-3xl font-bold text-brand-primary">{user.total_points}</p>
                </div>
              </div>

              {config && user.nivel !== 'oro' && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-gray-600">Siguiente nivel: {nextLevelName}</span>
                    <span className="text-brand-primary">{current} / {maxNext} pts</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    Faltan {maxNext - current} puntos
                  </p>
                </div>
              )}
            </div>

            {currentMembership && currentMembership.benefits && (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Star size={18} className="text-brand-primary" /> 
                  Beneficios del Nivel
                </h4>
                <ul className="space-y-2">
                  {currentMembership.benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-brand-primary mt-0.5">•</span>
                      {benefit}
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-brand-primary mt-0.5">•</span>
                    Descuento base: <strong className="ml-1">{currentMembership.discount_pct}%</strong>
                  </li>
                </ul>
              </div>
            )}

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-primary" /> 
                Ajuste manual de puntos
              </h4>
              <form onSubmit={handleSubmit((data) => adjustPointsMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Monto (+/-)</label>
                    <input 
                      type="number"
                      placeholder="Ej: 50 o -20"
                      {...register('amount', { required: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
                    <input 
                      type="text"
                      placeholder="Regalo por cumpleaños"
                      {...register('description', { required: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={adjustPointsMutation.isPending}
                  className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors"
                >
                  {adjustPointsMutation.isPending ? 'Aplicando...' : 'Aplicar Ajuste'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'visitas' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoadingAppointments ? (
              <p className="p-6 text-center text-gray-500">Cargando...</p>
            ) : appointments && appointments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {appointments.map(app => (
                  <div key={app.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-light text-brand-primary p-2 rounded-lg">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{app.service?.name || 'Servicio Desconocido'}</p>
                        <p className="text-sm text-gray-500">
                          {app.date} a las {app.time}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded uppercase ${
                      app.status === 'completado' ? 'bg-green-100 text-green-700' :
                      app.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                <p>No hay registro de citas para este cliente.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'puntos' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoadingPoints ? (
              <p className="p-6 text-center text-gray-500">Cargando...</p>
            ) : points && points.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-gray-500 font-medium">Fecha</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Acción</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Detalle</th>
                    <th className="px-4 py-3 text-right text-gray-500 font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {points.map(pt => (
                    <tr key={pt.id}>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(pt.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-medium text-gray-700">{pt.action}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pt.description}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${pt.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pt.amount > 0 ? '+' : ''}{pt.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <History className="mx-auto text-gray-300 mb-3" size={40} />
                <p>No hay historial de puntos.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;

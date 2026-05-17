import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@autolimpio/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, subDays, subMonths, 
  format, isSameDay, isWithinInterval, parseISO 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  DollarSign, Car, Users, TrendingUp, TrendingDown, 
  Calendar as CalendarIcon, Clock, CreditCard, Banknote, Landmark,
  Award
} from 'lucide-react';

const PRESETS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
  { id: '30dias', label: 'Últimos 30 días' },
];

const COLORS = ['#1a6b4a', '#22c55e', '#ef9f27', '#e1f5ee', '#0f3d2a'];

export default function Dashboard() {
  const [preset, setPreset] = useState('mes');

  // Calcular fechas según preset
  const dateRange = useMemo(() => {
    const now = new Date();
    let start, end, prevStart, prevEnd;

    switch (preset) {
      case 'hoy':
        start = startOfDay(now);
        end = endOfDay(now);
        prevStart = startOfDay(subDays(now, 1));
        prevEnd = endOfDay(subDays(now, 1));
        break;
      case 'semana':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        prevStart = startOfWeek(subDays(start, 1), { weekStartsOn: 1 });
        prevEnd = endOfWeek(subDays(start, 1), { weekStartsOn: 1 });
        break;
      case '30dias':
        start = startOfDay(subDays(now, 30));
        end = endOfDay(now);
        prevStart = startOfDay(subDays(now, 60));
        prevEnd = endOfDay(subDays(now, 31));
        break;
      case 'mes':
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        prevStart = startOfMonth(subMonths(now, 1));
        prevEnd = endOfMonth(subMonths(now, 1));
        break;
    }
    return { start, end, prevStart, prevEnd };
  }, [preset]);

  // Fetches
  const { data: currentPayments, isLoading: loadingPayments, error: errorPayments } = useQuery({
    queryKey: ['pagos', dateRange.start.toISOString(), dateRange.end.toISOString()],
    staleTime: 0,
    refetchInterval: 30000,
    queryFn: async () => {
      const startISO = dateRange.start.toISOString();
      const endISO = dateRange.end.toISOString();
      console.log('🔍 Fetching pagos:', { startISO, endISO });
      
      // Prueba sin filtro de fecha
      const { data: testPagos } = await supabase
        .from('pagos')
        .select('id, monto_final, created_at')
        .limit(5);
      console.log('🧪 Test sin filtro:', testPagos);

      const { data, error } = await supabase
        .from('pagos')
        .select('*, service:services(name), cajero:users!cajero_id(full_name)')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at', { ascending: false });
        
      console.log('📦 Resultado:', { count: data?.length, error, primerPago: data?.[0] });
      if (error) throw error;
      return data;
    }
  });

  const { data: previousPayments } = useQuery({
    queryKey: ['pagos_prev', dateRange.prevStart.toISOString(), dateRange.prevEnd.toISOString()],
    staleTime: 0,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .gte('created_at', dateRange.prevStart.toISOString())
        .lte('created_at', dateRange.prevEnd.toISOString());
      if (error) throw error;
      return data;
    }
  });

  const { data: currentUsers } = useQuery({
    queryKey: ['users_new', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'cliente')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
      if (error) throw error;
      return data;
    }
  });

  const { data: previousUsers } = useQuery({
    queryKey: ['users_new_prev', dateRange.prevStart.toISOString(), dateRange.prevEnd.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'cliente')
        .gte('created_at', dateRange.prevStart.toISOString())
        .lte('created_at', dateRange.prevEnd.toISOString());
      if (error) throw error;
      return data;
    }
  });

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (!currentPayments || !previousPayments || !currentUsers || !previousUsers) return null;

    // Ingresos (Monto final)
    const currentIngresos = currentPayments.reduce((sum, p) => sum + Number(p.monto_final), 0);
    const prevIngresos = previousPayments.reduce((sum, p) => sum + Number(p.monto_final), 0);
    const ingresosChange = prevIngresos ? ((currentIngresos - prevIngresos) / prevIngresos) * 100 : 100;

    // Autos lavados (Count de pagos)
    const currentLavados = currentPayments.length;
    const prevLavados = previousPayments.length;
    const lavadosChange = prevLavados ? ((currentLavados - prevLavados) / prevLavados) * 100 : 100;

    // Clientes nuevos
    const currentNuevos = currentUsers.length;
    const prevNuevos = previousUsers.length;
    const nuevosChange = prevNuevos ? ((currentNuevos - prevNuevos) / prevNuevos) * 100 : 100;

    // Servicio popular
    const serviceCounts = currentPayments.reduce((acc, p) => {
      const name = p.service?.name || 'Otro';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      ingresos: currentIngresos,
      ingresosChange,
      lavados: currentLavados,
      lavadosChange,
      nuevos: currentNuevos,
      nuevosChange,
      topService: topService ? topService[0] : 'Ninguno',
      topServiceCount: topService ? topService[1] : 0
    };
  }, [currentPayments, previousPayments, currentUsers, previousUsers]);

  // Gráficas de Ingresos por Día (Últimos 7 días base en el end date del preset o hoy)
  const chartIngresos = useMemo(() => {
    if (!currentPayments) return [];
    const days = 7;
    const result = [];
    const end = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(end, i);
      const startD = startOfDay(d);
      const endD = endOfDay(d);
      const pagosDelDia = currentPayments.filter(p => {
        const pDate = parseISO(p.created_at);
        return pDate >= startD && pDate <= endD;
      });
      result.push({
        name: format(d, 'EEEee', { locale: es }).substring(0, 3), // lun, mar
        ingresos: pagosDelDia.reduce((sum, p) => sum + Number(p.monto_final), 0),
        lavados: pagosDelDia.length
      });
    }
    return result;
  }, [currentPayments]);

  // Gráfica de ingresos por servicio (Pie)
  const pieData = useMemo(() => {
    if (!currentPayments) return [];
    const acc = currentPayments.reduce((obj, p) => {
      const name = p.service?.name || 'Otros';
      obj[name] = (obj[name] || 0) + Number(p.monto_final);
      return obj;
    }, {} as Record<string, number>);
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [currentPayments]);

  // Gráfica Horizontal de Mejores Clientes (Bar)
  const topClientes = useMemo(() => {
    if (!currentPayments) return [];
    const acc = currentPayments.reduce((obj, p) => {
      if (!p.user) return obj; // Ignorar sin app
      const name = p.user.full_name || 'Sin nombre';
      obj[name] = (obj[name] || 0) + 1;
      return obj;
    }, {} as Record<string, number>);
    return Object.entries(acc)
      .map(([name, visitas]) => ({ name, visitas }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 5);
  }, [currentPayments]);

  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const paginatedPayments = currentPayments?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) || [];

  return (
    <div className="space-y-6">
      {/* Header y Filtro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Visión general del autolavado</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                preset === p.id ? 'bg-brand-primary text-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {errorPayments && (
        <div className="bg-red-100 border border-red-200 text-red-700 p-6 rounded-xl shadow-sm my-6 font-bold">
          <p className="text-xl mb-2">Error de Base de Datos</p>
          <p>{errorPayments.message}</p>
          <p className="text-sm font-normal mt-2">Detalles para soporte: {JSON.stringify(errorPayments)}</p>
        </div>
      )}

      {loadingPayments ? (
        <div className="py-20 text-center text-gray-500">Cargando métricas...</div>
      ) : !errorPayments && (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title={`Ingresos (${PRESETS.find(p => p.id === preset)?.label})`}
              value={`$${metrics?.ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              change={metrics?.ingresosChange || 0}
              icon={<DollarSign size={24} className="text-brand-primary" />}
            />
            <MetricCard 
              title="Autos Lavados"
              value={metrics?.lavados.toLocaleString()}
              change={metrics?.lavadosChange || 0}
              icon={<Car size={24} className="text-brand-primary" />}
            />
            <MetricCard 
              title="Clientes Nuevos"
              value={metrics?.nuevos.toLocaleString()}
              change={metrics?.nuevosChange || 0}
              icon={<Users size={24} className="text-brand-primary" />}
            />
            <MetricCard 
              title="Servicio Popular"
              value={metrics?.topService}
              subtitle={`${metrics?.topServiceCount} veces`}
              icon={<Award size={24} className="text-brand-primary" />}
            />
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Ingresos (Últimos 7 días)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartIngresos}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, 'Ingresos']}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar dataKey="ingresos" fill="#1a6b4a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Autos Lavados (Últimos 7 días)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartIngresos}>
                    <defs>
                      <linearGradient id="colorLavados" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a6b4a" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1a6b4a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip cursor={{ stroke: '#1a6b4a', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="lavados" stroke="#1a6b4a" strokeWidth={3} fillOpacity={1} fill="url(#colorLavados)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Ingresos por Servicio</h3>
              <div className="h-64 w-full flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-MX', {minimumFractionDigits:2})}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400">Sin datos para este periodo</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Top Clientes Frecuentes</h3>
              <div className="h-72 w-full">
                {topClientes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topClientes} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fill: '#374151' }} />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="visitas" fill="#ef9f27" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Sin clientes recurrentes
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Transacciones */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Últimas Transacciones</h3>
            </div>
            
            {currentPayments && currentPayments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-4">Fecha/Hora</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Servicio</th>
                        <th className="px-6 py-4">Cajero</th>
                        <th className="px-6 py-4 text-center">Método</th>
                        <th className="px-6 py-4 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedPayments.map(p => {
                        const date = parseISO(p.created_at);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                <CalendarIcon size={14} className="text-gray-400" />
                                {format(date, 'dd/MM/yyyy')}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <Clock size={12} className="text-gray-400" />
                                {format(date, 'HH:mm')}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-gray-900">{p.user?.full_name || p.user_name || 'Sin nombre'}</p>
                              {!p.user && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Walk-in</span>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {p.service?.name || 'Servicio General'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {p.cajero?.full_name || 'Desconocido'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                p.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-800' :
                                p.metodo_pago === 'tarjeta' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {p.metodo_pago === 'efectivo' && <Banknote size={12} />}
                                {p.metodo_pago === 'tarjeta' && <CreditCard size={12} />}
                                {p.metodo_pago === 'transferencia' && <Landmark size={12} />}
                                <span className="capitalize">{p.metodo_pago}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-gray-900">
                                ${Number(p.monto_final).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})} MXN
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación simple */}
                {currentPayments.length > rowsPerPage && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <span className="text-sm text-gray-500">
                      Mostrando {page * rowsPerPage + 1} a {Math.min((page + 1) * rowsPerPage, currentPayments.length)} de {currentPayments.length}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        disabled={page === 0} 
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button 
                        disabled={(page + 1) * rowsPerPage >= currentPayments.length} 
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center px-4">
                <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <Banknote className="text-brand-primary w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">Aún no hay transacciones registradas</h4>
                <p className="text-gray-500 max-w-md mx-auto">
                  Los cobros realizados en la terminal de recepción aparecerán automáticamente aquí.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Mini Componente para las Cards de métricas
const MetricCard = ({ title, value, change, icon, subtitle }: any) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 bg-brand-light rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 truncate" title={String(value)}>{value}</p>
        
        {subtitle && (
          <p className="text-sm font-medium text-gray-500 mt-2">{subtitle}</p>
        )}
        
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <span className={`flex items-center text-xs font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
              {isPositive ? <TrendingUp size={14} className="mr-1" /> : isNegative ? <TrendingDown size={14} className="mr-1" /> : null}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">vs periodo anterior</span>
          </div>
        )}
      </div>
    </div>
  );
};

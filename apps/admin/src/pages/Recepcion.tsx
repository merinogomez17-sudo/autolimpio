import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@autolimpio/supabase';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  LogOut, Search, UserPlus, Clock, Calendar, CheckCircle2, 
  XCircle, Loader2, DollarSign, CreditCard, Landmark, Printer, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Asumiendo que AuthContext está allí, si no ajustaré

// Helpers
const PUNTOS_PLATA = 50;
const PUNTOS_ORO = 150;
function calcularPuntosGanados(monto: number, puntosConfig: number = 1): number {
  return Math.floor(monto / 10) * puntosConfig;
}

// Reloj en tiempo real
const RealtimeClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-right">
      <div className="font-bold text-gray-900 text-lg">{format(time, 'HH:mm:ss')}</div>
      <div className="text-xs text-gray-500 capitalize">{format(time, 'EEEE d, MMMM', { locale: es })}</div>
    </div>
  );
};

export default function Recepcion() {
  const { user: authUser, profile } = useAuth() || { user: null, profile: null }; // Fallback temporal si falla import
  const queryClient = useQueryClient();

  // Estados Layout y Navegación
  const [leftTab, setLeftTab] = useState<'citas' | 'buscar'>('citas');
  const [mobileTab, setMobileTab] = useState<'lista' | 'cobro'>('lista');
  
  // Estado de Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado Activo en Panel Derecho
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  // Formularios y Selecciones del Checkout
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [activePromo, setActivePromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo'|'tarjeta'|'transferencia' | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState('');
  
  // Estado Post-Pago
  const [successData, setSuccessData] = useState<any>(null);

  // -- Data Fetching --
  
  // 1. Configuración
  const { data: config } = useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const { data } = await supabase.from('configuracion').select('*').limit(1).single();
      return data;
    }
  });

  // 2. Servicios Activos
  const { data: services } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*').eq('is_active', true).order('price');
      return data || [];
    }
  });

  // 3. Citas de Hoy
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          user:users!user_id(id, full_name, nivel, total_points, avatar_url),
          service:services(id, name, price)
        `)
        .eq('date', todayStr)
        .order('time', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // 4. Búsqueda de Usuarios
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ['users', 'search', searchQuery],
    enabled: searchQuery.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'cliente')
        .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  // Suscripción Realtime a Citas
  useEffect(() => {
    const channel = supabase.channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => {
        queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Funciones de selección
  const handleSelectAppointment = (app: any) => {
    console.log('Ejecutando handleSelectAppointment con:', { app, user: app.user, serviceId: app.service_id });
    setActiveAppointment(app);
    setActiveUser(app.user);
    setIsWalkIn(false);
    setSelectedServiceId(app.service_id);
    resetCheckout();
    setMobileTab('cobro');
  };

  const handleSelectUser = (user: any) => {
    setActiveAppointment(null);
    setActiveUser(user);
    setIsWalkIn(false);
    resetCheckout();
    setMobileTab('cobro');
  };

  const handleStartWalkIn = () => {
    setActiveAppointment(null);
    setActiveUser(null);
    setIsWalkIn(true);
    setWalkInName('');
    setWalkInPhone('');
    resetCheckout();
    setMobileTab('cobro');
  };

  const resetCheckout = () => {
    setPromoCode('');
    setActivePromo(null);
    setPromoError('');
    setPaymentMethod(null);
    setAmountReceived('');
    setCheckoutError('');
    if (!activeAppointment) setSelectedServiceId('');
  };

  // Validación de Promo
  const handleApplyPromo = async () => {
    setPromoError('');
    setActivePromo(null);
    if (!promoCode.trim()) return;

    const { data: promos, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', promoCode.toUpperCase().trim())
      .limit(1);

    if (error || !promos || promos.length === 0) {
      setPromoError('Código inválido');
      return;
    }

    const promo = promos[0];

    if (!promo.is_active) {
      setPromoError('Promoción inactiva');
      return;
    }
    
    if (promo.valid_until && new Date(promo.valid_until + 'T00:00:00') < startOfDay(new Date())) {
      setPromoError('Promoción expirada');
      return;
    }

    if (promo.max_usos != null && promo.usos_actuales != null && promo.usos_actuales >= promo.max_usos) {
      setPromoError('Límite de usos alcanzado');
      return;
    }

    if (promo.servicios_aplicables != null && Array.isArray(promo.servicios_aplicables) && promo.servicios_aplicables.length > 0 && selectedServiceId) {
      if (!promo.servicios_aplicables.includes(selectedServiceId)) {
        setPromoError('No aplica a este servicio');
        return;
      }
    }

    setActivePromo(promo);
  };

  // Cálculos dinámicos de Checkout
  const selectedService = services?.find(s => s.id === selectedServiceId);
  const subtotal = selectedService ? Number(selectedService.price) : 0;
  
  let discount = 0;
  if (activePromo) {
    if (activePromo.discount_pct && activePromo.discount_pct > 0) {
      discount = subtotal * (activePromo.discount_pct / 100);
    } else if (activePromo.discount_fixed && activePromo.discount_fixed > 0) {
      discount = Math.min(activePromo.discount_fixed, subtotal);
    }
  }

  const total = subtotal - discount;
  const changeAmount = amountReceived ? Number(amountReceived) - total : 0;
  const canCheckout = selectedServiceId && paymentMethod && 
    (paymentMethod !== 'efectivo' || (amountReceived && Number(amountReceived) >= total)) &&
    (isWalkIn ? walkInName.trim().length > 0 : true);

  const ptsConfig = config?.puntos_por_cada_10 || 1;
  const expectedPoints = (!isWalkIn) ? calcularPuntosGanados(total, ptsConfig) : 0;

  // Procesar Pago RPC
  const processCheckoutMutation = useMutation({
    mutationFn: async () => {
      setCheckoutError('');
      
      const payload = {
        p_appointment_id: activeAppointment ? activeAppointment.id : null,
        p_user_id: activeUser ? activeUser.id : null,
        p_user_name: isWalkIn ? walkInName : (activeUser ? activeUser.full_name : 'Cliente Anónimo'),
        p_service_id: selectedServiceId,
        p_monto_original: subtotal,
        p_descuento: discount,
        p_monto_final: total,
        p_metodo_pago: paymentMethod,
        p_promotion_id: activePromo ? activePromo.id : null,
        p_puntos_ganados: expectedPoints,
        p_cajero_id: authUser?.id || null
      };

      console.log('Ejecutando RPC con payload:', payload);

      const { data, error } = await supabase.rpc('procesar_pago', payload);
      if (error) throw error;
      return data; // { pago_id, nuevo_total_puntos, nuevo_nivel, subio_de_nivel }
    },
    onSuccess: (data: any) => {
      console.log('RPC onSuccess - Response from procesar_pago:', data);
      const result = Array.isArray(data) ? data[0] : data;

      
      setSuccessData({
        pago_id: result?.pago_id,
        user_name: isWalkIn ? walkInName : activeUser?.full_name,
        service_name: selectedService?.name,
        subtotal, discount, total, paymentMethod,
        change: paymentMethod === 'efectivo' ? changeAmount : 0,
        expectedPoints,
        nuevo_total_puntos: result?.nuevo_total_puntos || 0,
        nuevo_nivel: result?.nuevo_nivel || 'bronce',
        subio_de_nivel: result?.subio_de_nivel || false,
        date: new Date()
      });

      // Limpiar y resetear vistas tras un tick
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      setActiveAppointment(null);
      setActiveUser(null);
      setIsWalkIn(false);
      resetCheckout();
      setMobileTab('lista');
    },
    onError: (err: any) => {
      console.error('RPC onError - Error from procesar_pago:', err);
      setCheckoutError(err.message || 'Error al procesar el pago. Intenta de nuevo.');
      alert('Error en el cobro: ' + (err.message || 'Desconocido'));
    }
  });

  const handlePrintTicket = () => {
    const printContent = document.getElementById('ticket-print-area')?.innerHTML;
    if (!printContent) {
      alert('No se encontró el contenido del ticket.');
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes (popups) en tu navegador para imprimir el ticket.');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Cobro - ${config?.nombre_negocio || 'Autolimpio'}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: monospace; 
              color: #000; 
              margin: 0; 
              padding: 15px; 
              width: 72mm;
              font-size: 13px; 
              line-height: 1.5;
            }
            h1 { font-size: 18px; margin: 0 0 5px 0; font-weight: bold; text-align: center; }
            p { margin: 0; }
            .center { text-align: center; }
            .right { text-align: right; }
            .flex-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .bold { font-weight: bold; }
            .border-dash { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
            .border-top-dash { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .mb-4 { margin-bottom: 15px; }
            .mt-6 { margin-top: 25px; }
            .text-xs { font-size: 11px; }
            .text-base { font-size: 15px; }
            .uppercase { text-transform: uppercase; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Renderizadores
  return (
    <div className="h-full w-full bg-gray-100 flex flex-col font-sans text-[18px] overflow-hidden">
      {/* CONTENIDO 2 COLUMNAS / TABS */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* TABS PARA MOVIL */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20">
          <button 
            className={`flex-1 py-4 text-center font-bold text-sm ${mobileTab === 'lista' ? 'text-brand-primary border-t-2 border-brand-primary' : 'text-gray-500'}`}
            onClick={() => setMobileTab('lista')}
          >
            LISTA
          </button>
          <button 
            className={`flex-1 py-4 text-center font-bold text-sm ${mobileTab === 'cobro' ? 'text-brand-primary border-t-2 border-brand-primary' : 'text-gray-500'}`}
            onClick={() => setMobileTab('cobro')}
          >
            COBRO
          </button>
        </div>

        {/* COLUMNA IZQUIERDA: LISTA DE CITAS (38%) */}
        <div className={`${mobileTab === 'lista' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[38%] border-r border-gray-200 bg-white h-full pb-16 lg:pb-0`}>
          
          <div className="flex border-b border-gray-200">
            <button 
              className={`flex-1 py-4 font-bold text-sm border-b-2 transition-colors ${leftTab === 'citas' ? 'border-brand-primary text-brand-primary bg-brand-light/30' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              onClick={() => setLeftTab('citas')}
            >
              Citas de Hoy
            </button>
            <button 
              className={`flex-1 py-4 font-bold text-sm border-b-2 transition-colors ${leftTab === 'buscar' ? 'border-brand-primary text-brand-primary bg-brand-light/30' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              onClick={() => setLeftTab('buscar')}
            >
              Buscar Cliente
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {leftTab === 'citas' && (
              <div className="space-y-3">
                {loadingAppointments ? (
                  <div className="text-center py-10 text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" /> Cargando citas...</div>
                ) : appointments && appointments.length > 0 ? (
                  appointments.map(app => {
                    const statusVal = (app.status || '').toLowerCase();
                    const canSelect = statusVal === 'pending' || statusVal === 'in_progress' || statusVal === 'in-progress';
                    
                    // Mapeo para UI
                    let statusDisplay = statusVal;
                    let badgeClass = 'bg-gray-100 text-gray-600';
                    if (statusVal === 'completed') {
                      statusDisplay = 'completado';
                      badgeClass = 'bg-green-100 text-green-700';
                    } else if (statusVal === 'pending') {
                      statusDisplay = 'pendiente';
                      badgeClass = 'bg-gray-100 text-gray-600';
                    } else if (statusVal === 'in_progress' || statusVal === 'in-progress') {
                      statusDisplay = 'en proceso';
                      badgeClass = 'bg-yellow-100 text-yellow-700 animate-pulse';
                    } else if (statusVal === 'cancelled') {
                      statusDisplay = 'cancelado';
                      badgeClass = 'bg-red-100 text-red-700';
                    }

                    return (
                    <div 
                      key={app.id} 
                      onClick={() => {
                        console.log('Click en cita:', app.id, 'status:', statusVal, 'canSelect:', canSelect);
                        if (canSelect) handleSelectAppointment(app);
                      }}
                      className={`p-4 rounded-xl border bg-white shadow-sm transition-all ${
                        statusVal === 'completed' ? 'opacity-60 grayscale' :
                        statusVal === 'cancelled' ? 'opacity-50 border-red-100' :
                        'cursor-pointer hover:border-brand-primary hover:shadow-md'
                      } ${activeAppointment?.id === app.id ? 'ring-2 ring-brand-primary border-transparent' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-brand-primary" />
                          <span className="font-extrabold text-xl text-gray-900 tracking-tight">{app.time.substring(0,5)}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
                          {statusDisplay}
                        </span>
                      </div>
                      
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        {app.user?.full_name || 'Sin nombre'}
                        {app.user?.nivel && (
                          <span className={`w-2 h-2 rounded-full ${
                            app.user.nivel === 'oro' ? 'bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 
                            app.user.nivel === 'plata' ? 'bg-slate-400' : 'bg-orange-700'
                          }`} title={app.user.nivel} />
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{app.service?.name || 'Servicio'}</p>
                    </div>
                  );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                    <p>No hay citas agendadas para hoy.</p>
                  </div>
                )}
              </div>
            )}

            {leftTab === 'buscar' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Nombre o teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-brand-primary focus:border-brand-primary shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  {loadingSearch && <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-brand-primary" /></div>}
                  {searchResults?.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm cursor-pointer hover:border-brand-primary transition-colors flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.phone || 'Sin teléfono'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                        user.nivel === 'oro' ? 'bg-yellow-50 text-yellow-700' : 
                        user.nivel === 'plata' ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-800'
                      }`}>
                        {user.nivel}
                      </span>
                    </div>
                  ))}
                  {searchQuery.length >= 2 && searchResults?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No se encontraron clientes.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-200 shrink-0">
            <button 
              onClick={handleStartWalkIn}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
            >
              <UserPlus size={22} />
              + Cobro sin cita
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: PANEL DE COBRO (62%) */}
        <div className={`${mobileTab === 'cobro' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[62%] bg-gray-50 h-full relative pb-16 lg:pb-0`}>
          
          {(!activeAppointment && !activeUser && !isWalkIn) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Landmark size={40} className="text-gray-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Panel de Caja Inactivo</h2>
              <p className="text-center max-w-sm">
                Selecciona una cita pendiente, busca un cliente existente o inicia un cobro sin cita en el panel izquierdo.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* HEADER DE CAJA */}
              <div className="bg-white px-8 py-6 border-b border-gray-200 shadow-sm shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-inner ${
                    isWalkIn ? 'bg-gray-400' :
                    activeUser?.nivel === 'oro' ? 'bg-yellow-500' :
                    activeUser?.nivel === 'plata' ? 'bg-slate-400' : 'bg-orange-700'
                  }`}>
                    {isWalkIn ? 'W' : (activeUser?.full_name?.charAt(0) || 'U')}
                  </div>
                  <div>
                    {isWalkIn ? (
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Walk-in (Sin cuenta)</h2>
                    ) : (
                      <>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{activeUser?.full_name}</h2>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            activeUser?.nivel === 'oro' ? 'bg-yellow-100 text-yellow-800' :
                            activeUser?.nivel === 'plata' ? 'bg-slate-200 text-slate-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            Nivel {activeUser?.nivel}
                          </span>
                          <span className="text-sm font-semibold text-brand-primary">• {activeUser?.total_points} pts acumulados</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <button onClick={resetCheckout} className="p-2 text-gray-400 hover:text-gray-900" title="Cancelar">
                  <X size={24} />
                </button>
              </div>

              {/* CUERPO DE CAJA */}
              <div className="p-8 flex-1 flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto w-full">
                
                {/* Formulario / Opciones */}
                <div className="flex-1 space-y-6">
                  {/* Datos Walk-in si aplica */}
                  {isWalkIn && (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Cliente (Requerido)</label>
                        <input 
                          type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)}
                          className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                          placeholder="Ej: Juan Pérez"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono (Opcional)</label>
                        <input 
                          type="text" value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)}
                          className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Selección de Servicio */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Servicio a Cobrar</label>
                    <select 
                      value={selectedServiceId} 
                      onChange={e => setSelectedServiceId(e.target.value)}
                      className="w-full text-lg p-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:bg-white outline-none font-medium cursor-pointer"
                    >
                      <option value="" disabled>Seleccione un servicio...</option>
                      {services?.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                      ))}
                    </select>
                  </div>

                  {/* Promoción */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Código Promocional</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)}
                        className="flex-1 text-lg p-3 uppercase font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                        placeholder="Ej: BIENVENIDO o LUNES50"
                      />
                      <button 
                        onClick={handleApplyPromo}
                        className="px-6 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {promoError && <p className="text-red-600 text-sm font-bold mt-2">{promoError}</p>}
                    {activePromo && (
                      <p className="text-green-600 text-sm font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 size={16} /> Promo Aplicada: {activePromo.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Totales y Pago */}
                <div className="w-full xl:w-96 flex flex-col gap-6">
                  
                  {/* Ticket Summary */}
                  <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-4">Resumen de Cobro</h3>
                    
                    <div className="space-y-3 mb-6 font-medium">
                      <div className="flex justify-between text-gray-300">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-400 font-bold">
                          <span>Descuento</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-700 pt-3 flex justify-between items-end">
                        <span className="text-lg">TOTAL</span>
                        <span className="text-4xl font-black">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {!isWalkIn && expectedPoints > 0 && (
                      <div className="bg-brand-primary/20 border border-brand-primary/30 rounded-lg p-3 flex items-center justify-center gap-2 text-brand-light font-bold text-sm">
                        <span className="text-lg">🌟</span> +{expectedPoints} Puntos a ganar
                      </div>
                    )}
                  </div>

                  {/* Método de Pago */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Método de Pago</h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <button 
                        onClick={() => { setPaymentMethod('efectivo'); setAmountReceived(''); }}
                        className={`py-3 flex flex-col items-center justify-center gap-1 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'efectivo' ? 'border-brand-primary bg-brand-light/20 text-brand-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <DollarSign size={24} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Efectivo</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('tarjeta')}
                        className={`py-3 flex flex-col items-center justify-center gap-1 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'tarjeta' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard size={24} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Tarjeta</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('transferencia')}
                        className={`py-3 flex flex-col items-center justify-center gap-1 rounded-lg border-2 transition-colors ${
                          paymentMethod === 'transferencia' ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <Landmark size={24} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Transf.</span>
                      </button>
                    </div>

                    {paymentMethod === 'efectivo' && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monto Recibido</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">$</span>
                          <input 
                            type="number" 
                            value={amountReceived}
                            onChange={e => setAmountReceived(e.target.value)}
                            className="w-full text-2xl font-black p-3 pl-8 border-2 border-brand-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-light"
                            placeholder="0.00"
                          />
                        </div>
                        {changeAmount >= 0 && amountReceived ? (
                          <div className="mt-3 flex justify-between items-center text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
                            <span>Cambio a devolver:</span>
                            <span className="text-2xl">${changeAmount.toFixed(2)}</span>
                          </div>
                        ) : amountReceived && changeAmount < 0 ? (
                          <div className="mt-2 text-sm text-red-500 font-bold">Monto insuficiente</div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div>
                    {checkoutError && <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 font-bold">{checkoutError}</div>}
                    
                    <button 
                      disabled={!canCheckout || processCheckoutMutation.isPending}
                      onClick={() => processCheckoutMutation.mutate()}
                      className="w-full py-5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl font-black text-xl flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/30 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    >
                      {processCheckoutMutation.isPending ? (
                        <><Loader2 className="animate-spin" size={24} /> PROCESANDO...</>
                      ) : (
                        'REGISTRAR PAGO'
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE ÉXITO & TICKET DE IMPRESIÓN */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSuccessData(null)} />
          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden relative">
            
            <div className="flex flex-col h-full">
              {successData.subio_de_nivel && (
                <div className="bg-yellow-400 text-yellow-900 p-4 text-center font-black text-lg animate-in slide-in-from-top-full">
                  ¡NUEVO NIVEL: {successData.nuevo_nivel.toUpperCase()}! 🎉
                </div>
              )}
              
              <div className="p-8 text-center flex-1">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">Pago Exitoso</h2>
                <p className="text-gray-500 font-medium mb-6">{successData.user_name}</p>
                
                <div className="text-5xl font-black text-gray-900 mb-6">
                  ${successData.total.toFixed(2)}
                </div>

                {successData.change > 0 && (
                  <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <p className="text-sm font-bold text-gray-500 uppercase">Cambio entregado</p>
                    <p className="text-2xl font-black text-gray-900">${successData.change.toFixed(2)}</p>
                  </div>
                )}

                {successData.expectedPoints > 0 && (
                  <div className="flex justify-between items-center bg-brand-light/30 border border-brand-primary/20 p-4 rounded-xl text-brand-primary font-bold">
                    <span>Puntos ganados:</span>
                    <span className="text-xl">+{successData.expectedPoints}</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-3">
                <button 
                  onClick={handlePrintTicket}
                  className="py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50"
                >
                  <Printer size={18} /> Ticket
                </button>
                <button 
                  onClick={() => setSuccessData(null)}
                  className="py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center hover:bg-black"
                >
                  Nuevo Cobro
                </button>
              </div>
            </div>

            {/* CONTENIDO DEL TICKET PARA LA VENTANA DE IMPRESIÓN */}
            <div id="ticket-print-area" className="hidden">
              <div className="center mb-4">
                <h1>{config?.nombre_negocio || 'AUTOLIMPIO'}</h1>
                <p className="text-xs">{config?.direccion}</p>
                <p className="text-xs">{config?.telefono}</p>
                <p className="text-xs border-dash">Ticket: #{successData.pago_id?.split('-')[0].toUpperCase()}</p>
              </div>

              <div className="mb-4">
                <p>Fecha: {format(successData.date, 'dd/MM/yyyy HH:mm')}</p>
                <p>Cliente: {successData.user_name}</p>
                <p>Cajero: {profile?.full_name || 'Admin'}</p>
              </div>

              <div className="border-dash mb-4">
                <div className="flex-row">
                  <span>{successData.service_name}</span>
                  <span>${successData.subtotal.toFixed(2)}</span>
                </div>
                {successData.discount > 0 && (
                  <div className="flex-row">
                    <span>Descuento</span>
                    <span>-${successData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex-row bold text-base border-top-dash">
                  <span>TOTAL</span>
                  <span>${successData.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <p>Método de pago: <span className="uppercase">{successData.paymentMethod}</span></p>
                {successData.paymentMethod === 'efectivo' && (
                  <p>Cambio: ${successData.change.toFixed(2)}</p>
                )}
              </div>

              {successData.expectedPoints > 0 && (
                <div className="border-top-dash mb-4">
                  <p>Puntos ganados: +{successData.expectedPoints}</p>
                  <p>Total acumulado: {successData.nuevo_total_puntos}</p>
                  <p>Nivel actual: {successData.nuevo_nivel.toUpperCase()}</p>
                </div>
              )}

              <div className="center mt-6">
                <p>¡Gracias por su preferencia!</p>
                <p>Vuelva pronto</p>
                <p className="mt-6 text-xs">.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

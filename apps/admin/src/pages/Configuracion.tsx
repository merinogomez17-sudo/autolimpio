import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Configuracion, User } from '@autolimpio/supabase';
import { Upload, Save, UserPlus, Star, ShieldBan, ShieldCheck, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { createClient } from '@supabase/supabase-js';

// Modal simplificado para agregar cajero
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md z-10 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ConfiguracionPage = () => {
  const queryClient = useQueryClient();
  const [isCajeroModalOpen, setCajeroModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // -- Queries --
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracion').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data as Configuracion | null;
    }
  });

  const { data: cajeros, isLoading: isLoadingCajeros } = useQuery({
    queryKey: ['recepcion_users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'recepcion');
      if (error) throw error;
      return data as User[];
    }
  });

  // -- Formulario Configuración --
  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      nombre_negocio: '',
      direccion: '',
      telefono: '',
      puntos_por_cada_10: 1,
      puntos_para_plata: 50,
      puntos_para_oro: 150
    }
  });

  useEffect(() => {
    if (config) {
      reset({
        nombre_negocio: config.nombre_negocio || '',
        direccion: config.direccion || '',
        telefono: config.telefono || '',
        puntos_por_cada_10: config.puntos_por_cada_10 || 1,
        puntos_para_plata: config.puntos_para_plata || 50,
        puntos_para_oro: config.puntos_para_oro || 150
      });
      if (config.logo_url) setLogoPreview(config.logo_url);
    }
  }, [config, reset]);

  const puntosPlata = watch('puntos_para_plata');
  const puntosOro = watch('puntos_para_oro');
  const puntosMulti = watch('puntos_por_cada_10');

  // -- Mutations --
  const saveConfigMutation = useMutation({
    mutationFn: async (formData: any) => {
      let uploadedLogoUrl = config?.logo_url;

      // Si hay archivo, subimos a Storage 'assets'
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(fileName);
        uploadedLogoUrl = publicUrlData.publicUrl;
      }

      const payload = {
        nombre_negocio: formData.nombre_negocio,
        direccion: formData.direccion,
        telefono: formData.telefono,
        logo_url: uploadedLogoUrl,
        puntos_por_cada_10: Number(formData.puntos_por_cada_10),
        puntos_para_plata: Number(formData.puntos_para_plata),
        puntos_para_oro: Number(formData.puntos_para_oro),
        updated_at: new Date().toISOString()
      };

      if (config?.id) {
        // Update
        const { error } = await supabase.from('configuracion').update(payload).eq('id', config.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('configuracion').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
      alert('Configuración guardada correctamente.');
    }
  });

  const toggleCajeroStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from('users').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recepcion_users'] })
  });

  // Manejo de Logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  if (isLoadingConfig) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración General</h1>
        <button 
          onClick={handleSubmit((d) => saveConfigMutation.mutate(d))}
          disabled={saveConfigMutation.isPending}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50"
        >
          <Save size={20} />
          {saveConfigMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Datos del Negocio & Club de Lealtad */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECCIÓN 1: Datos del Negocio */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-gray-900">Datos del Negocio</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="text-gray-400" size={32} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo del Negocio</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-primary hover:file:bg-brand-light/80"
                  />
                  <p className="text-xs text-gray-500 mt-2">Recomendado: PNG o JPG transparente, 512x512px.</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                <input 
                  {...register('nombre_negocio', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Física</label>
                <input 
                  {...register('direccion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal</label>
                <input 
                  {...register('telefono')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Club de Lealtad */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-gray-900">Club de Lealtad (Umbrales)</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntos por cada $10</label>
                  <input 
                    type="number" 
                    {...register('puntos_por_cada_10', { valueAsNumber: true, min: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntos para Plata</label>
                  <input 
                    type="number" 
                    {...register('puntos_para_plata', { valueAsNumber: true, min: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-300 focus:border-gray-400 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntos para Oro</label>
                  <input 
                    type="number" 
                    {...register('puntos_para_oro', { valueAsNumber: true, min: 2 })}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-yellow-400 focus:border-yellow-400 bg-yellow-50"
                  />
                </div>
              </div>

              {/* Visual Preview */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 relative overflow-hidden">
                <h3 className="text-sm font-semibold text-slate-800 mb-6 relative z-10 flex items-center gap-2">
                  <Star size={16} className="text-brand-primary fill-brand-primary" />
                  Visualización de Umbrales
                </h3>
                
                <div className="relative pt-6 pb-2">
                  {/* Línea base */}
                  <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                  
                  {/* Nodos */}
                  <div className="flex justify-between relative z-10">
                    <div className="flex flex-col items-center group cursor-default">
                      <div className="w-5 h-5 rounded-full bg-orange-700 border-4 border-white shadow-md relative -top-2"></div>
                      <span className="text-xs font-bold text-orange-800 mt-2">Bronce</span>
                      <span className="text-[10px] text-gray-500 font-mono">0 pts</span>
                    </div>
                    
                    <div className="flex flex-col items-center relative -left-[10%] group cursor-default">
                      <div className="w-5 h-5 rounded-full bg-slate-400 border-4 border-white shadow-md relative -top-2"></div>
                      <span className="text-xs font-bold text-slate-600 mt-2">Plata</span>
                      <span className="text-[10px] text-gray-500 font-mono">{puntosPlata || 50} pts</span>
                    </div>

                    <div className="flex flex-col items-center group cursor-default">
                      <div className="w-5 h-5 rounded-full bg-yellow-500 border-4 border-white shadow-md relative -top-2"></div>
                      <span className="text-xs font-bold text-yellow-600 mt-2">Oro</span>
                      <span className="text-[10px] text-gray-500 font-mono">{puntosOro || 150}+ pts</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center mt-4">
                  Nota: Al pagar un servicio de $100, el cliente obtendrá {10 * (puntosMulti || 1)} puntos.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Cuentas de Recepción */}
        <div className="lg:col-span-1">
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Recepción</h2>
              <button 
                onClick={() => setCajeroModalOpen(true)}
                className="text-brand-primary hover:text-brand-hover p-1"
                title="Agregar Cajero"
              >
                <UserPlus size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
              {isLoadingCajeros ? (
                <p className="text-center text-sm text-gray-500 py-4">Cargando cajeros...</p>
              ) : cajeros && cajeros.length > 0 ? (
                cajeros.map(cajero => (
                  <div key={cajero.id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                        cajero.is_active ? 'bg-brand-primary' : 'bg-gray-400'
                      }`}>
                        {cajero.full_name?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${cajero.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                          {cajero.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{cajero.phone || 'Sin teléfono'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cajero.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cajero.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => toggleCajeroStatusMutation.mutate({ id: cajero.id, is_active: !cajero.is_active })}
                        className={`p-1.5 rounded-full transition-colors ${
                          cajero.is_active ? 'text-green-600 hover:bg-red-50 hover:text-red-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                        }`}
                        title={cajero.is_active ? 'Haz clic para Desactivar' : 'Haz clic para Activar'}
                      >
                        {cajero.is_active ? <ShieldCheck size={20} /> : <ShieldBan size={20} />}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <UserPlus className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-sm text-gray-500">No hay cajeros registrados.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Agregar Cajero */}
      <Modal isOpen={isCajeroModalOpen} onClose={() => setCajeroModalOpen(false)} title="Nuevo Cajero de Recepción">
        <AddCajeroForm onClose={() => setCajeroModalOpen(false)} />
      </Modal>
    </div>
  );
};

// Formulario para registrar a un cajero con contraseña
const AddCajeroForm = ({ onClose }: { onClose: () => void }) => {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { full_name: '', email: '', password: '' }
  });

  const onSubmit = async (data: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Creamos un cliente secundario temporal sin persistencia de sesión para no desloguear al Admin
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const tempSupabase = createClient(url, key, {
        auth: { persistSession: false }
      });

      const { data: authData, error } = await tempSupabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: 'recepcion'
          }
        }
      });

      if (error) throw error;
      
      setSuccessMsg(`Cajero ${data.full_name} registrado exitosamente.`);
      queryClient.invalidateQueries({ queryKey: ['recepcion_users'] });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Error al registrar el cajero.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4 font-medium">
          {successMsg}
        </div>
      )}
      {!successMsg && (
        <p className="text-sm text-gray-600 mb-4">
          Ingresa los datos y la contraseña para el nuevo cajero de recepción. Podrá iniciar sesión inmediatamente con su correo y contraseña.
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
        <input 
          {...register('full_name', { required: true })}
          placeholder="Ej: Alejandro Merino"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email de Acceso</label>
        <input 
          type="email"
          {...register('email', { required: true })}
          placeholder="cajero1@autolimpio.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input 
          type="password"
          {...register('password', { required: true, minLength: 6 })}
          placeholder="Mínimo 6 caracteres"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary"
        />
      </div>
      
      <div className="pt-4 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-md font-medium">Cancelar</button>
        <button type="submit" disabled={isSubmitting || !!successMsg} className="flex-1 py-2 text-white bg-brand-primary rounded-md font-medium disabled:opacity-50">
          {isSubmitting ? 'Registrando...' : 'Registrar Cajero'}
        </button>
      </div>
    </form>
  );
};

export default ConfiguracionPage;

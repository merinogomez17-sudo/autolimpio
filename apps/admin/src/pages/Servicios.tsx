import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Service } from '@autolimpio/supabase';
import { Plus, Edit2, Trash2, X, icons } from 'lucide-react';
import { useForm } from 'react-hook-form';

// Basic Drawer Component inline for simplicity and robustness
const Drawer = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
};

const toPascalCase = (str: string) =>
  str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

const ServiceIcon = ({ name }: { name: string }) => {
  const pascalName = name ? toPascalCase(name) : 'Car';
  const Icon = (icons as any)[pascalName] || (icons as any)['Car'];
  return <Icon size={20} className="text-brand-primary shrink-0" />;
};

const Servicios = () => {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Queries
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Service[];
    }
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from('services').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        <button 
          onClick={handleCreate}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-hover transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nuevo Servicio
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Cargando servicios...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Duración</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services?.map(service => (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <ServiceIcon name={service.icon || ''} />
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {service.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${service.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {service.duration_min ? `${service.duration_min} min` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleActiveMutation.mutate({ id: service.id, is_active: !service.is_active })}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                        service.is_active 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {service.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-3 text-gray-400">
                    <button onClick={() => handleEdit(service)} className="hover:text-brand-primary transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {services?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay servicios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Usaremos un componente separado para el Formulario dentro del Drawer para mantenerlo limpio */}
      {isDrawerOpen && (
        <Drawer 
          isOpen={isDrawerOpen} 
          onClose={() => { setDrawerOpen(false); setSelectedService(null); }} 
          title={selectedService ? 'Editar Servicio' : 'Nuevo Servicio'}
        >
          <ServiceForm 
            service={selectedService} 
            onClose={() => { setDrawerOpen(false); setSelectedService(null); }} 
          />
        </Drawer>
      )}
    </div>
  );
};

// Componente de Formulario (React Hook Form)

const ServiceForm = ({ service, onClose }: { service: Service | null, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      price: service?.price || 0,
      duration_min: service?.duration_min || 30,
      icon: service?.icon || '💧',
      is_active: service?.is_active ?? true
    }
  });

  React.useEffect(() => {
    if (service) {
      reset({
        name: service.name || '',
        description: service.description || '',
        price: service.price || 0,
        duration_min: service.duration_min || 30,
        icon: service.icon || '💧',
        is_active: service.is_active ?? true
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        duration_min: 30,
        icon: '💧',
        is_active: true
      });
    }
  }, [service, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (service) {
        const { error } = await supabase
          .from('services')
          .update({
            name: data.name,
            description: data.description,
            price: data.price,
            duration_min: data.duration_min,
            is_active: data.is_active,
            icon: data.icon
          })
          .eq('id', service.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onClose();
    }
  });

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input 
          {...register('name', { required: 'El nombre es obligatorio' })} 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
          placeholder="Ej: Lavado Express"
        />
        {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message as string}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea 
          {...register('description')} 
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
          <input 
            type="number" step="0.01"
            {...register('price', { valueAsNumber: true, required: true })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
          <input 
            type="number"
            {...register('duration_min', { valueAsNumber: true })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Emoji)</label>
        <input 
          {...register('icon')} 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" 
          id="is_active" 
          {...register('is_active')} 
          className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Servicio activo</label>
      </div>

      <div className="pt-6 flex gap-3">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={saveMutation.isPending}
          className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover font-medium disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default Servicios;

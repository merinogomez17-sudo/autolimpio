import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Promotion } from '@autolimpio/supabase';
import { Plus, Edit2, Trash2, X, Download } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';

// Basic Drawer Component inline
const Drawer = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[450px] bg-white shadow-2xl z-50 flex flex-col">
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

const getPromoState = (promo: Promotion) => {
  if (!promo.is_active) return { label: 'Inactiva', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  
  if (promo.valid_until) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Comparar solo la fecha
    const validUntilDate = new Date(promo.valid_until + 'T00:00:00'); // Tratar como local
    
    if (validUntilDate < today) {
      return { label: 'Expirada', color: 'bg-red-50 text-red-700 border-red-200' };
    }
  }
  
  return { label: 'Activa', color: 'bg-green-50 text-green-700 border-green-200' };
};

const Promociones = () => {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Queries
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    }
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from('promotions').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta promoción?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingPromo(null);
    setDrawerOpen(true);
  };

  const downloadQR = (code: string) => {
    const svg = document.getElementById(`qr-${code}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${code}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
        <button 
          onClick={handleCreate}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-hover transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nueva Promoción
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Cargando promociones...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Promo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Código / QR</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Beneficio</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Vigencia</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promotions?.map(promo => {
                const state = getPromoState(promo);
                return (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{promo.title}</p>
                      <p className="text-xs text-gray-500 max-w-xs truncate">{promo.description}</p>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="bg-white p-1 border rounded shadow-sm relative group">
                        <QRCodeSVG id={`qr-${promo.code}`} value={promo.code} size={40} />
                        <button 
                          onClick={() => downloadQR(promo.code)}
                          className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white rounded transition-all"
                          title="Descargar QR"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {promo.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand-primary">
                      {promo.discount_pct ? `${promo.discount_pct}% OFF` : `$${promo.discount_fixed} OFF`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {promo.valid_from ? new Date(promo.valid_from + 'T00:00:00').toLocaleDateString() : 'Siempre'} - 
                      {promo.valid_until ? new Date(promo.valid_until + 'T00:00:00').toLocaleDateString() : 'Sin límite'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleActiveMutation.mutate({ id: promo.id, is_active: !promo.is_active })}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${state.color}`}
                      >
                        {state.label}
                      </button>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-3 text-gray-400">
                      <button onClick={() => handleEdit(promo)} className="hover:text-brand-primary transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {promotions?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay promociones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isDrawerOpen && (
        <Drawer 
          isOpen={isDrawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          title={editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}
        >
          <PromoForm 
            promo={editingPromo} 
            onClose={() => setDrawerOpen(false)} 
          />
        </Drawer>
      )}
    </div>
  );
};

const PromoForm = ({ promo, onClose }: { promo: Promotion | null, onClose: () => void }) => {
  const queryClient = useQueryClient();
  
  // Determinamos el tipo de descuento inicial
  const defaultDiscountType = promo?.discount_fixed ? 'fixed' : 'pct';
  const defaultDiscountValue = promo?.discount_fixed || promo?.discount_pct || 0;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: promo?.title || '',
      description: promo?.description || '',
      code: promo?.code || '',
      discountType: defaultDiscountType, // 'pct' | 'fixed'
      discountValue: defaultDiscountValue,
      valid_from: promo?.valid_from || '',
      valid_until: promo?.valid_until || '',
      is_active: promo?.is_active ?? true
    }
  });

  const discountType = watch('discountType');

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Mapear el formulario al schema real
      const payload = {
        title: data.title,
        description: data.description || null,
        code: data.code.toUpperCase().replace(/\s+/g, ''), // Asegurar código limpio
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
        is_active: data.is_active,
        discount_pct: data.discountType === 'pct' ? Number(data.discountValue) : null,
        discount_fixed: data.discountType === 'fixed' ? Number(data.discountValue) : null,
      };

      if (promo) {
        const { error } = await supabase.from('promotions').update(payload).eq('id', promo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promotions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      onClose();
    }
  });

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título de Promoción</label>
        <input 
          {...register('title', { required: 'El título es obligatorio' })} 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
          placeholder="Ej: Lunes de Descuento"
        />
        {errors.title && <span className="text-red-500 text-xs mt-1">{errors.title.message as string}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Código (Alfanumérico)</label>
        <input 
          {...register('code', { required: 'El código es obligatorio' })} 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary uppercase font-mono"
          placeholder="Ej: LUNES20"
        />
        {errors.code && <span className="text-red-500 text-xs mt-1">{errors.code.message as string}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea 
          {...register('description')} 
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-900 mb-3">Tipo de Descuento</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="pct" {...register('discountType')} className="text-brand-primary focus:ring-brand-primary" />
            Porcentaje (%)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="fixed" {...register('discountType')} className="text-brand-primary focus:ring-brand-primary" />
            Monto Fijo ($)
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor a descontar {discountType === 'pct' ? '(%)' : '($)'}
          </label>
          <input 
            type="number" step={discountType === 'pct' ? "1" : "0.01"}
            {...register('discountValue', { required: true, min: 0 })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
            placeholder={discountType === 'pct' ? "Ej: 15" : "Ej: 50.00"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Válido Desde</label>
          <input 
            type="date"
            {...register('valid_from')} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Válido Hasta</label>
          <input 
            type="date"
            {...register('valid_until')} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" 
          id="is_active" 
          {...register('is_active')} 
          className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Promoción activa</label>
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

export default Promociones;

export type UserRole = 'admin' | 'recepcion' | 'cliente';
export type LoyaltyLevel = 'bronce' | 'plata' | 'oro';
export type AppointmentStatus = 'pending' | 'in_progress' | 'in-progress' | 'completed' | 'cancelled';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface User {
  id: string; // UUID
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  nivel: LoyaltyLevel;
  total_points: number;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string; // UUID
  name: string;
  description: string | null;
  price: number;
  duration_min: number | null;
  is_active: boolean;
  icon: string | null;
  created_at: string;
}

export interface Appointment {
  id: string; // UUID
  user_id: string | null; // User.id
  service_id: string; // Service.id
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  status: AppointmentStatus;
  notes: string | null;
  points_earned: number | null;
  created_at: string;
}

export interface Promotion {
  id: string; // UUID
  title: string;
  description: string | null;
  discount_pct: number | null;
  discount_fixed: number | null;
  code: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

export interface Pago {
  id: string; // UUID
  appointment_id: string | null; // Appointment.id
  user_id: string | null; // User.id
  user_name: string | null;
  service_id: string; // Service.id
  monto_original: number;
  descuento: number;
  monto_final: number;
  metodo_pago: PaymentMethod;
  promotion_id: string | null; // Promotion.id
  puntos_ganados: number;
  cajero_id: string | null; // User.id
  created_at: string;
}

export interface Membership {
  id: string; // UUID
  name: string;
  min_points: number;
  discount_pct: number;
  color: string | null;
  icon: string | null;
  benefits: string[] | null;
  created_at: string;
}

export interface PointHistory {
  id: string; // UUID
  user_id: string;
  amount: number;
  action: string;
  description: string;
  created_at: string;
}

export interface Configuracion {
  id: string; // UUID
  nombre_negocio: string;
  direccion: string | null;
  telefono: string | null;
  logo_url: string | null;
  puntos_por_cada_10: number;
  puntos_para_plata: number;
  puntos_para_oro: number;
  updated_at: string;
}

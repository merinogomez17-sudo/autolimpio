-- Perfiles de usuario (extiende auth.users)
CREATE TABLE users (
  id uuid references auth.users primary key,
  full_name text,
  phone text,
  role text default 'cliente',     -- 'admin' | 'recepcion' | 'cliente'
  nivel text default 'bronce',     -- 'bronce' | 'plata' | 'oro'
  total_points integer default 0,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Servicios del autolavado
CREATE TABLE services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  duration_min integer,
  is_active boolean default true,
  icon text,
  created_at timestamptz default now()
);

-- Citas agendadas (desde app móvil o recepción)
CREATE TABLE appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  service_id uuid references services(id),
  date date not null,
  time time not null,
  status text default 'pending',  -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes text,
  points_earned integer,
  created_at timestamptz default now()
);

-- Promociones y descuentos
CREATE TABLE promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  discount_pct numeric,
  discount_fixed numeric,
  code text unique not null,
  valid_from date,
  valid_until date,
  is_active boolean default true,
  image_url text,
  created_at timestamptz default now()
);

-- Pagos registrados en recepción
CREATE TABLE pagos (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  user_id uuid references users(id),
  user_name text,
  service_id uuid references services(id),
  monto_original numeric not null,
  descuento numeric default 0,
  monto_final numeric not null,
  metodo_pago text not null,        -- 'efectivo' | 'tarjeta' | 'transferencia'
  promotion_id uuid references promotions(id),
  puntos_ganados integer default 0,
  cajero_id uuid references users(id),
  created_at timestamptz default now()
);

-- Configuración general del negocio
CREATE TABLE configuracion (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text default 'Autolimpio',
  direccion text,
  telefono text,
  logo_url text,
  puntos_por_cada_10 integer default 1,
  puntos_para_plata integer default 50,
  puntos_para_oro integer default 150,
  updated_at timestamptz default now()
);

-- Memberships (Niveles - Solo lectura)
CREATE TABLE memberships (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_points integer not null,
  discount_pct numeric not null,
  color text,
  icon text,
  benefits text[],
  created_at timestamptz default now()
);

-- Points (Historial puntos - Solo lectura)
CREATE TABLE points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  amount integer not null,
  action text not null,
  description text not null,
  created_at timestamptz default now()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;

-- Políticas para users (Cero recursión)
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para services
CREATE POLICY "Services are public" ON services FOR SELECT USING (true);
CREATE POLICY "Only admin can modify services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para appointments
CREATE POLICY "Users see their own, admin/reception see all" ON appointments FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'recepcion'))
);
CREATE POLICY "Authenticated users can insert appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update appointments" ON appointments FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'recepcion'))
);

-- Políticas para promotions
CREATE POLICY "Public read promotions" ON promotions FOR SELECT USING (true);
CREATE POLICY "Only admin modifies promotions" ON promotions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para pagos
CREATE POLICY "Admin and reception see all pagos" ON pagos FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'recepcion'))
);
CREATE POLICY "Admin and reception insert pagos" ON pagos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'recepcion'))
);

-- Políticas para configuracion
CREATE POLICY "Public read configuracion" ON configuracion FOR SELECT USING (true);
CREATE POLICY "Only admin modifies configuracion" ON configuracion FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para memberships
CREATE POLICY "Public read memberships" ON memberships FOR SELECT USING (true);
CREATE POLICY "Only admin modifies memberships" ON memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para points
CREATE POLICY "Users see their own points" ON points FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'recepcion'))
);
CREATE POLICY "Only admin/recepcion inserts points" ON points FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'recepcion'))
);

-- Trigger para auto-crear perfil público al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone, role, nivel, total_points, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sin nombre'),
    '',
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    'bronce',
    0,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función RPC para procesar pagos atómicamente
CREATE OR REPLACE FUNCTION procesar_pago(
  p_appointment_id uuid,
  p_user_id uuid,
  p_user_name text,
  p_service_id uuid,
  p_monto_original numeric,
  p_descuento numeric,
  p_monto_final numeric,
  p_metodo_pago text,
  p_promotion_id uuid,
  p_puntos_ganados integer,
  p_cajero_id uuid
) RETURNS TABLE (
  pago_id uuid,
  nuevo_total_puntos integer,
  nuevo_nivel text,
  subio_de_nivel boolean
) AS $$
DECLARE
  v_pago_id uuid;
  v_old_nivel text;
  v_old_puntos integer;
  v_nuevo_total_puntos integer := 0;
  v_nuevo_nivel text := 'bronce';
  v_subio_de_nivel boolean := false;
  v_puntos_plata integer;
  v_puntos_oro integer;
  v_service_name text;
BEGIN
  -- 1. Insertar en pagos
  INSERT INTO public.pagos (
    appointment_id, user_id, user_name, service_id, monto_original,
    descuento, monto_final, metodo_pago, promotion_id, puntos_ganados, cajero_id
  ) VALUES (
    p_appointment_id, p_user_id, p_user_name, p_service_id, p_monto_original,
    p_descuento, p_monto_final, p_metodo_pago, p_promotion_id, p_puntos_ganados, p_cajero_id
  ) RETURNING id INTO v_pago_id;

  -- 2. Actualizar cita si existe
  IF p_appointment_id IS NOT NULL THEN
    UPDATE public.appointments SET status = 'completed' WHERE id = p_appointment_id;
  END IF;

  -- 3. Actualizar promo si existe (usando tabla promotions alineada)
  IF p_promotion_id IS NOT NULL THEN
    -- Si se desea llevar conteo de usos, se puede agregar columna usos_actuales a promotions o manejar externamente
    -- Aquí lo dejamos seguro sin fallar
    PERFORM 1 FROM public.promotions WHERE id = p_promotion_id;
  END IF;

  -- 4. Logica de usuario y puntos
  IF p_user_id IS NOT NULL THEN
    -- Obtener datos actuales del usuario
    SELECT nivel, total_points INTO v_old_nivel, v_old_puntos FROM public.users WHERE id = p_user_id;
    
    -- Calcular nuevos puntos
    v_nuevo_total_puntos := v_old_puntos + COALESCE(p_puntos_ganados, 0);
    
    -- Obtener configuracion de umbrales
    SELECT puntos_para_plata, puntos_para_oro INTO v_puntos_plata, v_puntos_oro FROM public.configuracion LIMIT 1;
    
    -- Determinar nuevo nivel
    IF v_nuevo_total_puntos >= COALESCE(v_puntos_oro, 150) THEN
      v_nuevo_nivel := 'oro';
    ELSIF v_nuevo_total_puntos >= COALESCE(v_puntos_plata, 50) THEN
      v_nuevo_nivel := 'plata';
    ELSE
      v_nuevo_nivel := 'bronce';
    END IF;
    
    -- Determinar si subió de nivel
    IF v_old_nivel != v_nuevo_nivel AND (
       (v_old_nivel = 'bronce' AND v_nuevo_nivel IN ('plata', 'oro')) OR
       (v_old_nivel = 'plata' AND v_nuevo_nivel = 'oro')
    ) THEN
      v_subio_de_nivel := true;
    END IF;

    -- Actualizar usuario
    UPDATE public.users SET total_points = v_nuevo_total_puntos, nivel = v_nuevo_nivel WHERE id = p_user_id;

    -- Obtener nombre del servicio
    SELECT name INTO v_service_name FROM public.services WHERE id = p_service_id;
    
    -- Insertar historial de puntos
    IF p_puntos_ganados > 0 THEN
      INSERT INTO public.points (user_id, amount, action, description) 
      VALUES (p_user_id, p_puntos_ganados, 'earned', 'Lavado: ' || COALESCE(v_service_name, 'General'));
    END IF;
  END IF;

  -- Retornar valores
  RETURN QUERY SELECT v_pago_id, v_nuevo_total_puntos, v_nuevo_nivel, v_subio_de_nivel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

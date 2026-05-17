-- Asegurar configuración inicial
INSERT INTO configuracion (id, nombre_negocio, direccion, telefono, puntos_por_cada_10, puntos_para_plata, puntos_para_oro)
VALUES (gen_random_uuid(), 'Autolimpio', 'Av. Principal 123, Centro', '555-1234', 1, 50, 150);

-- Memberships base
INSERT INTO memberships (id, name, min_points, discount_pct, color, icon) VALUES
(gen_random_uuid(), 'bronce', 0, 0, '#cd7f32', 'Award'),
(gen_random_uuid(), 'plata', 50, 10, '#c0c0c0', 'Award'),
(gen_random_uuid(), 'oro', 150, 20, '#ffd700', 'Award');

-- Servicios de ejemplo
INSERT INTO services (id, name, description, price, duration_min, is_active, icon) VALUES
(gen_random_uuid(), 'Lavado Express', 'Lavado exterior rápido, aspirado básico y secado.', 80, 20, true, 'car-wash'),
(gen_random_uuid(), 'Lavado Completo', 'Lavado exterior detallado, aspirado profundo, limpieza de tablero y llantas.', 150, 45, true, 'sparkles'),
(gen_random_uuid(), 'Detallado Premium', 'Lavado exterior e interior, encerado, limpieza de asientos y acondicionador de plásticos.', 350, 90, true, 'star');

-- Promociones de ejemplo
INSERT INTO promotions (id, title, description, discount_pct, discount_fixed, code, is_active) VALUES
(gen_random_uuid(), 'Bienvenida', '10% de descuento en tu primer lavado', 10, null, 'BIENVENIDO', true),
(gen_random_uuid(), 'Lunes 50', '$50 de descuento en Lavado Completo o Premium', null, 50, 'LUNES50', true);

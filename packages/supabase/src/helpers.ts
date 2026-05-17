import { LoyaltyLevel, Promotion } from './types';

// Definición de umbrales por defecto (se pueden sobreescribir desde configuración de base de datos)
const PUNTOS_PLATA = 50;
const PUNTOS_ORO = 150;

/**
 * Calcula el nivel de lealtad basado en los puntos actuales
 */
export function calcularNivel(puntos: number): LoyaltyLevel {
  if (puntos >= PUNTOS_ORO) return 'oro';
  if (puntos >= PUNTOS_PLATA) return 'plata';
  return 'bronce';
}

/**
 * Calcula cuántos puntos se ganan en una transacción
 * @param monto Monto final pagado
 * @param puntosConfig Multiplicador de puntos por cada 10 unidades monetarias (por defecto 1)
 */
export function calcularPuntosGanados(monto: number, puntosConfig: number = 1): number {
  return Math.floor(monto / 10) * puntosConfig;
}

/**
 * Calcula el descuento a aplicar según la promoción
 * @param monto Monto base
 * @param promo Objeto de promoción con los nuevos campos discount_pct y discount_fixed
 */
export function calcularDescuento(monto: number, promo: Promotion | null): number {
  if (!promo || !promo.is_active) return 0;
  
  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    return 0; // Promoción expirada
  }
  
  // Si tenemos limite de usos lo validaremos en backend
  
  if (promo.discount_pct !== null && promo.discount_pct > 0) {
    return monto * (promo.discount_pct / 100);
  } else if (promo.discount_fixed !== null && promo.discount_fixed > 0) {
    return Math.min(promo.discount_fixed, monto); // No descontar más del monto total
  }
  
  return 0;
}

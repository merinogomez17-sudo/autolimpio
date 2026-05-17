export const APP_LINKS = {
  appStore: import.meta.env?.VITE_APP_STORE_URL || "https://apps.apple.com/app/autolimpio",
  playStore: import.meta.env?.VITE_PLAY_STORE_URL || "https://play.google.com/store/apps/autolimpio",
  instagram: "https://instagram.com/autolimpio",
  facebook: "https://facebook.com/autolimpio",
  tiktok: "https://tiktok.com/@autolimpio",
  whatsapp: import.meta.env?.VITE_WHATSAPP_NUMBER ? `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}` : "https://wa.me/5215551234567",
};

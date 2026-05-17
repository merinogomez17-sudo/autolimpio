import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Apple, Play, Sparkles, Droplets, Calendar, Star } from 'lucide-react';
import { isIOS, isAndroid } from 'react-device-detect';
import { APP_LINKS } from '@autolimpio/config';

interface HeroProps {
  onDownloadClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onDownloadClick }) => {
  const shouldReduceMotion = useReducedMotion();

  const handleDownload = () => {
    if (isIOS) {
      window.open(APP_LINKS.appStore, '_blank');
    } else if (isAndroid) {
      window.open(APP_LINKS.playStore, '_blank');
    } else {
      onDownloadClick(); // Desktop -> show modal
    }
  };

  const animationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, staggerChildren: 0.2 }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-brand-primary to-[#166045]">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-hover/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-accent/20 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <motion.div {...animationProps} className="text-white text-center lg:text-left">
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20"
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={18} className="text-brand-accent" />
              <span className="text-sm font-medium">Tu autolavado en un tap</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            >
              Agenda, lava y gana <span className="text-brand-accent">beneficios</span>.
            </motion.h1>
            
            <motion.p 
              className="text-lg lg:text-xl text-brand-light mb-10 max-w-xl mx-auto lg:mx-0"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            >
              Olvida las filas. Reserva tu cita desde el celular, llega y tu lugar ya estará esperándote.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            >
              <button 
                onClick={handleDownload}
                className="w-full sm:w-auto bg-brand-accent text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:scale-105 hover:bg-[#d98b1e] transition-all"
              >
                Descargar Gratis
              </button>
              
              <div className="flex gap-4 mt-4 sm:mt-0 opacity-80">
                <Apple size={32} />
                <Play size={32} />
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - iPhone Mockup SVG */}
          <motion.div 
            className="flex justify-center"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 40 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
          >
            <div className="relative w-[300px] h-[600px] drop-shadow-2xl">
              {/* iPhone Frame SVG */}
              <svg viewBox="0 0 300 600" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Frame */}
                <rect x="0" y="0" width="300" height="600" rx="45" fill="#111" />
                {/* Inner Screen Bezel */}
                <rect x="8" y="8" width="284" height="584" rx="38" fill="#000" />
                
                {/* Screen Content - Clip Path */}
                <clipPath id="screenClip">
                  <rect x="12" y="12" width="276" height="576" rx="34" />
                </clipPath>
                
                <g clipPath="url(#screenClip)">
                  {/* Background */}
                  <rect x="12" y="12" width="276" height="576" fill="#f9fafb" />
                  
                  {/* Top Header App */}
                  <rect x="12" y="12" width="276" height="120" fill="#1a6b4a" />
                  <text x="32" y="80" fill="#fff" fontSize="20" fontWeight="bold" fontFamily="sans-serif">¡Hola, Carlos!</text>
                  <text x="32" y="100" fill="#e1f5ee" fontSize="12" fontFamily="sans-serif">Tienes 120 puntos 🌟</text>
                  
                  {/* Main Content Area UI */}
                  <rect x="24" y="150" width="252" height="140" rx="16" fill="#fff" />
                  <text x="40" y="180" fill="#111" fontSize="16" fontWeight="bold" fontFamily="sans-serif">Tu próxima cita</text>
                  <rect x="40" y="200" width="220" height="70" rx="8" fill="#f3f4f6" />
                  <circle cx="65" cy="235" r="15" fill="#1a6b4a" />
                  <path d="M60 235 L64 239 L70 231" stroke="#fff" strokeWidth="2" fill="none" />
                  <text x="95" y="228" fill="#111" fontSize="14" fontWeight="bold" fontFamily="sans-serif">Lavado Completo</text>
                  <text x="95" y="246" fill="#666" fontSize="12" fontFamily="sans-serif">Hoy, 14:00 hrs</text>

                  {/* Services Grid */}
                  <text x="24" y="325" fill="#111" fontSize="16" fontWeight="bold" fontFamily="sans-serif">Agendar servicio</text>
                  
                  <rect x="24" y="340" width="120" height="100" rx="12" fill="#fff" />
                  <circle cx="84" cy="375" r="18" fill="#e1f5ee" />
                  <text x="84" y="380" fill="#1a6b4a" fontSize="18" textAnchor="middle" fontFamily="sans-serif">💧</text>
                  <text x="84" y="415" fill="#111" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Express</text>

                  <rect x="156" y="340" width="120" height="100" rx="12" fill="#fff" />
                  <circle cx="216" cy="375" r="18" fill="#e1f5ee" />
                  <text x="216" y="380" fill="#1a6b4a" fontSize="18" textAnchor="middle" fontFamily="sans-serif">✨</text>
                  <text x="216" y="415" fill="#111" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Completo</text>

                  <rect x="24" y="455" width="252" height="70" rx="12" fill="#ef9f27" />
                  <text x="40" y="485" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">Nivel Plata 🥈</text>
                  <text x="40" y="505" fill="#fff" fontSize="12" fontFamily="sans-serif">10% de descuento activo</text>

                  {/* Bottom Navigation */}
                  <rect x="12" y="520" width="276" height="68" fill="#fff" />
                  {/* Fake icons */}
                  <circle cx="58" cy="554" r="12" fill="#1a6b4a" />
                  <circle cx="150" cy="554" r="12" fill="#ccc" />
                  <circle cx="242" cy="554" r="12" fill="#ccc" />
                </g>

                {/* Dynamic Island / Notch */}
                <rect x="100" y="20" width="100" height="25" rx="12.5" fill="#000" />
              </svg>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;

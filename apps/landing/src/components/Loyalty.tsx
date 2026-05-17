import React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Award, Star, Zap } from 'lucide-react';

const Loyalty = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="club" className="py-24 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Club de Lealtad</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Por cada $10 pesos de lavado ganas 1 punto. Sube de nivel y desbloquea beneficios exclusivos.
          </p>
        </div>

        <motion.div 
          ref={ref}
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          animate={isInView || shouldReduceMotion ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {/* Bronce */}
          <motion.div variants={shouldReduceMotion ? {} : itemVariants} className="bg-gray-800/80 backdrop-blur border border-gray-700 p-8 rounded-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#cd7f32]/20 flex items-center justify-center mb-4">
              <Star className="text-[#cd7f32] w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#cd7f32] mb-1">Bronce</h3>
            <p className="text-sm text-gray-400 mb-6">0 - 49 puntos</p>
            <ul className="text-gray-300 space-y-3 text-sm">
              <li>Acceso a promociones especiales</li>
              <li>Recordatorios de cita</li>
            </ul>
          </motion.div>

          {/* Plata */}
          <motion.div variants={shouldReduceMotion ? {} : itemVariants} className="bg-gray-800/80 backdrop-blur border border-gray-600 p-8 rounded-2xl flex flex-col items-center text-center relative scale-100 md:scale-105 z-10 shadow-2xl">
            <div className="absolute -top-3 bg-gray-700 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase text-gray-300">
              Popular
            </div>
            <div className="w-16 h-16 rounded-full bg-[#9ca3af]/20 flex items-center justify-center mb-4">
              <Award className="text-[#9ca3af] w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#9ca3af] mb-1">Plata</h3>
            <p className="text-sm text-gray-400 mb-6">50 - 149 puntos</p>
            <ul className="text-gray-300 space-y-3 text-sm font-medium">
              <li>10% de descuento automático</li>
              <li>Prioridad en agendamiento</li>
              <li>Soporte preferencial</li>
            </ul>
          </motion.div>

          {/* Oro */}
          <motion.div variants={shouldReduceMotion ? {} : itemVariants} className="bg-gradient-to-b from-[#f59e0b]/20 to-gray-800/80 backdrop-blur border border-[#f59e0b]/50 p-8 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
            {!shouldReduceMotion && (
              <motion.div 
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent)",
                  backgroundSize: "200% 100%"
                }}
              />
            )}
            <div className="w-16 h-16 rounded-full bg-[#f59e0b]/20 flex items-center justify-center mb-4 relative z-10">
              <Zap className="text-[#f59e0b] w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#f59e0b] mb-1 relative z-10">Oro</h3>
            <p className="text-sm text-gray-400 mb-6 relative z-10">150+ puntos</p>
            <ul className="text-gray-200 space-y-3 text-sm font-semibold relative z-10">
              <li>20% de descuento automático</li>
              <li>Cita Exprés sin filas</li>
              <li>1 Lavado Básico gratis al mes</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Loyalty;

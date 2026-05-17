import React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const services = [
  {
    icon: "🚿",
    name: "Lavado Express",
    price: "desde $80",
    description: "Lavado exterior rápido, aspirado básico y secado a mano para salir del apuro."
  },
  {
    icon: "✨",
    name: "Lavado Completo",
    price: "desde $150",
    description: "Lavado exterior detallado, aspirado profundo, limpieza de tablero y llantas."
  },
  {
    icon: "💎",
    name: "Detallado Premium",
    price: "desde $350",
    description: "Lavado exterior e interior, encerado, limpieza de asientos y acondicionador de plásticos."
  },
  {
    icon: "🪟",
    name: "Limpieza de Vidrios",
    price: "desde $60",
    description: "Tratamiento repelente de agua y limpieza interior/exterior de cristales."
  }
];

const Services = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="servicios" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Elige el servicio perfecto para tu vehículo. Calidad garantizada en cada gota.
          </p>
        </div>

        <div 
          ref={ref}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto"
        >
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={(isInView || shouldReduceMotion) ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              className="bg-white p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-lg border border-transparent hover:border-brand-hover/30 transition-all duration-300 flex items-start gap-6"
            >
              <div className="text-5xl shrink-0">{service.icon}</div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                  <span className="bg-brand-light text-brand-primary text-sm font-semibold px-3 py-1 rounded-full">
                    {service.price}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

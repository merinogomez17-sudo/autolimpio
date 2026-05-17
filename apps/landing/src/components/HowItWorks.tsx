import React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Calendar, Car, Star } from 'lucide-react';

const steps = [
  {
    icon: <Calendar className="w-8 h-8 text-brand-primary" />,
    title: "Agenda tu cita",
    description: "Elige el servicio que necesitas, fecha y horario en cuestión de segundos.",
    number: "1"
  },
  {
    icon: <Car className="w-8 h-8 text-brand-primary" />,
    title: "Llega y listo",
    description: "El equipo de Autolimpio ya te espera con todo preparado para tu vehículo.",
    number: "2"
  },
  {
    icon: <Star className="w-8 h-8 text-brand-primary" />,
    title: "Acumula puntos",
    description: "Cada lavado suma puntos para ganar beneficios, descuentos y lavados gratis.",
    number: "3"
  }
];

const HowItWorks = () => {
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
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section id="como-funciona" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Diseñamos un proceso rápido y sin fricciones para que tu auto esté limpio cuando lo necesites.
          </p>
        </div>

        <motion.div 
          ref={ref}
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          animate={isInView || shouldReduceMotion ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8"
        >
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              variants={shouldReduceMotion ? {} : itemVariants}
              className="relative p-8 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow duration-300"
            >
              {/* Giant Background Number */}
              <div className="absolute -right-4 -bottom-4 text-[150px] font-black text-gray-100 select-none group-hover:text-brand-light transition-colors duration-300">
                {step.number}
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;

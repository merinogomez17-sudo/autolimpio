import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    initials: "CM",
    name: "Carlos M.",
    level: "Oro",
    levelColor: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
    avatarColor: "bg-[#f59e0b]",
    text: "Desde que descargué Autolimpio nunca más tuve que esperar. Llego y mi lugar ya está reservado."
  },
  {
    initials: "FR",
    name: "Fernanda R.",
    level: "Plata",
    levelColor: "bg-[#9ca3af]/10 text-[#9ca3af] border-[#9ca3af]/20",
    avatarColor: "bg-[#9ca3af]",
    text: "Los puntos se acumulan rapidísimo. Ya llevo 2 lavados gratis este mes y el servicio es excelente."
  },
  {
    initials: "DL",
    name: "Diego L.",
    level: "Bronce",
    levelColor: "bg-[#cd7f32]/10 text-[#cd7f32] border-[#cd7f32]/20",
    avatarColor: "bg-[#cd7f32]",
    text: "La app es muy fácil de usar y siempre me recuerdan mi cita por notificación. 10/10."
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-lg text-gray-600">Únete a cientos de usuarios satisfechos.</p>
        </div>

        {/* Desktop Grid & Mobile Scroll Snap */}
        <div className="flex overflow-x-auto pb-8 md:grid md:grid-cols-3 gap-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
          {testimonials.map((test, idx) => (
            <div 
              key={idx} 
              className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center bg-gray-50 border border-gray-100 rounded-2xl p-8 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" className="text-[#f59e0b]" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-8 flex-1">"{test.text}"</p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-12 h-12 rounded-full ${test.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
                  {test.initials}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{test.name}</h4>
                  <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold mt-1 ${test.levelColor}`}>
                    Nivel {test.level}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

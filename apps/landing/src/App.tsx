import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Services from './components/Services';
import Loyalty from './components/Loyalty';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import DownloadModal from './components/DownloadModal';

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
      <Navbar onDownloadClick={() => setShowModal(true)} />
      
      <main>
        <Hero onDownloadClick={() => setShowModal(true)} />
        <HowItWorks />
        <Services />
        <Loyalty />
        <Testimonials />
      </main>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-brand-primary to-brand-hover text-white py-20 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">¿Listo para un auto reluciente?</h2>
        <p className="text-xl mb-8 opacity-90 max-w-xl mx-auto">
          Gratis · Sin tarjeta · Descarga en segundos
        </p>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-brand-primary px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:scale-105 transition-transform"
        >
          Descargar Autolimpio
        </button>
      </section>

      <Footer />

      {showModal && <DownloadModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default App;

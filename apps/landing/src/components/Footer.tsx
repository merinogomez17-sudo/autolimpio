import React from 'react';
import { Droplets, Instagram, Facebook } from 'lucide-react';
import { APP_LINKS } from '@autolimpio/config';

const Footer = () => {
  return (
    <footer className="bg-[#111] text-gray-400 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-800 pb-8 mb-8">
          <div className="flex items-center gap-2 text-white">
            <Droplets size={24} weight="fill" className="text-brand-primary" />
            <span className="text-xl font-bold tracking-tight">Autolimpio</span>
          </div>
          
          <div className="flex gap-4">
            <a href={APP_LINKS.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href={APP_LINKS.facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Facebook size={20} />
            </a>
            <a href={APP_LINKS.tiktok} target="_blank" rel="noreferrer" className="hover:text-white transition-colors font-bold flex items-center justify-center">
              <span className="text-xs">TikTok</span>
            </a>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© 2025 Autolimpio. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Aviso de Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

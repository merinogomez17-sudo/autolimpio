import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Apple, Play } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_LINKS } from '@autolimpio/config';

interface DownloadModalProps {
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ onClose }) => {
  // Cierra el modal con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 text-center border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Descarga Autolimpio</h3>
            <p className="text-gray-600">Escanea el código con la cámara de tu celular para descargar la app gratis.</p>
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-gray-50/50">
            
            {/* iOS Column */}
            <div className="p-8 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center mb-6 shadow-md">
                <Apple size={24} fill="currentColor" />
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <QRCodeSVG 
                  value={APP_LINKS.appStore} 
                  size={160} 
                  fgColor="#111827" 
                  level="H"
                />
              </div>
              <p className="font-bold text-gray-900">iPhone & iPad</p>
              <p className="text-sm text-gray-500 mt-1">Requiere iOS 13.0+</p>
            </div>

            {/* Android Column */}
            <div className="p-8 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#3DDC84] text-white flex items-center justify-center mb-6 shadow-md">
                <Play size={24} fill="currentColor" />
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <QRCodeSVG 
                  value={APP_LINKS.playStore} 
                  size={160} 
                  fgColor="#111827" 
                  level="H"
                />
              </div>
              <p className="font-bold text-gray-900">Android</p>
              <p className="text-sm text-gray-500 mt-1">Requiere Android 8.0+</p>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DownloadModal;

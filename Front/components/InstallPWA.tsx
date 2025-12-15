
import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { Button, MangaCard } from './UI';

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already installed/standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
    
    if (isStandaloneMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture install event (Android/Chrome/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not iOS (iOS needs manual instructions, handled separately)
      if (!isIosDevice) setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not installed, show banner after a small delay
    if (isIosDevice && !isStandaloneMode) {
        setTimeout(() => setShowBanner(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <MangaCard className="bg-black text-white border-2 border-torami-red shadow-[4px_4px_0px_0px_#D70000] p-4 relative">
        <button 
            onClick={() => setShowBanner(false)} 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
            <X size={20} />
        </button>

        <div className="flex items-center gap-4 pr-6">
            <div className="bg-white p-2 rounded border border-gray-500 hidden sm:block">
                <Smartphone className="text-torami-red w-6 h-6" />
            </div>
            
            <div className="flex-grow">
                <h4 className="font-display text-lg uppercase text-yellow-400 leading-none mb-1">
                    ¡Instalá la App!
                </h4>
                
                {isIOS ? (
                    <div className="text-xs text-gray-300">
                        <p className="mb-1">Para instalar en iPhone/iPad:</p>
                        <p className="flex items-center gap-1 font-bold text-white">
                            1. Tocá <Share size={14} /> Compartir
                        </p>
                        <p className="flex items-center gap-1 font-bold text-white">
                            2. Elegí <PlusSquare size={14} /> "Agregar a Inicio"
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-gray-300">
                        Accedé más rápido, usala sin internet y recibí notificaciones.
                    </p>
                )}
            </div>
        </div>

        {!isIOS && (
            <Button 
                onClick={handleInstallClick} 
                className="w-full mt-3 bg-torami-red hover:bg-red-600 border-white text-white flex items-center justify-center gap-2 py-2 text-sm"
            >
                <Download size={16} /> Instalar Torami Fest
            </Button>
        )}
      </MangaCard>
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { Button, MangaCard } from './UI';

const DISMISSED_KEY = 'torami_pwa_dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if user dismissed the banner recently
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) {
      return; // Don't show banner if dismissed within last 7 days
    }

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

    // Show banner after delay for all devices (iOS gets instructions, others get install button if available)
    // This ensures the banner appears even if beforeinstallprompt doesn't fire
    const showTimeout = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(showTimeout);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // Mark as installed permanently
      localStorage.setItem(DISMISSED_KEY, (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <MangaCard className="bg-black text-white border-2 border-torami-red shadow-[4px_4px_0px_0px_#D70000] p-4 relative">
        <button
            onClick={() => {
              localStorage.setItem(DISMISSED_KEY, Date.now().toString());
              setShowBanner(false);
            }}
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
                ) : deferredPrompt ? (
                    <p className="text-xs text-gray-300">
                        Accedé más rápido, usala sin internet y recibí notificaciones.
                    </p>
                ) : (
                    <div className="text-xs text-gray-300">
                        <p>Instalá la app desde el menú de tu navegador:</p>
                        <p className="font-bold text-white mt-1">⋮ → "Instalar aplicación"</p>
                    </div>
                )}
            </div>
        </div>

        {!isIOS && deferredPrompt && (
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

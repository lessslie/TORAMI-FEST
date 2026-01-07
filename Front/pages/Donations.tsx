import React, { useEffect, useState } from 'react';
import { Heart, ExternalLink, Copy, Check, TrendingUp, Users } from 'lucide-react';
import { SectionTitle, MangaCard, Button } from '../components/UI';
import { getConfig, getDonationStats } from '../services/data';
import { AppConfig, DonationStats } from '../types';

export const Donations = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCBU, setCopiedCBU] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);

  useEffect(() => {
    Promise.all([
      getConfig(),
      getDonationStats()
    ])
      .then(([configData, statsData]) => {
        setConfig(configData);
        setStats(statsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopyAlias = () => {
    if (config?.aliasCbu) {
      navigator.clipboard.writeText(config.aliasCbu);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCBU = () => {
    navigator.clipboard.writeText('4530000800012291620067');
    setCopiedCBU(true);
    setTimeout(() => setCopiedCBU(false), 2000);
  };

  const handleCopyAliasFixed = () => {
    navigator.clipboard.writeText('toramifest.nx');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Heart className="animate-pulse text-torami-red w-12 h-12 mx-auto" />
        <p className="mt-4 text-gray-600">Cargando información de donaciones...</p>
      </div>
    );
  }

  if (!config?.donationsEnabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <MangaCard className="text-center py-12">
          <Heart className="text-gray-400 w-16 h-16 mx-auto mb-4" />
          <h2 className="font-display text-2xl mb-2">Donaciones Desactivadas</h2>
          <p className="text-gray-600">Las donaciones no están disponibles en este momento.</p>
        </MangaCard>
      </div>
    );
  }

  const donationTitle = config.donationTitle || 'Donaciones a Caridad';
  const donationDescription = config.donationDescription || 'En esta ocasión, las donaciones recaudadas irán destinadas a ayudar a quienes más lo necesitan. Tu aporte hace la diferencia.';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SectionTitle>
        <span className="flex items-center gap-3 justify-center">
          <Heart className="text-torami-red fill-current animate-pulse" /> {donationTitle}
        </span>
      </SectionTitle>

      {/* Progress Bar */}
      {config.donationGoal && stats && (
        <MangaCard className="mb-8 border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              <h3 className="font-display text-2xl text-green-700">Progreso de Donaciones</h3>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Meta</p>
              <p className="font-bold text-xl">${config.donationGoal.toLocaleString('es-AR')}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-2xl text-green-600">
                ${(stats.total || 0).toLocaleString('es-AR')}
              </span>
              <span className="text-sm text-gray-600">
                {config.donationGoal > 0
                  ? `${Math.round(((stats.total || 0) / config.donationGoal) * 100)}%`
                  : '0%'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-6 border-2 border-black overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  width: `${Math.min(100, config.donationGoal > 0 ? ((stats.total || 0) / config.donationGoal) * 100 : 0)}%`,
                }}
              >
                {config.donationGoal > 0 && ((stats.total || 0) / config.donationGoal) * 100 > 10
                  && `${Math.round(((stats.total || 0) / config.donationGoal) * 100)}%`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-300">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{stats.count || 0} donación{stats.count !== 1 ? 'es' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-pink-500 fill-current" />
              <span>¡Gracias por tu apoyo!</span>
            </div>
          </div>
        </MangaCard>
      )}

      <MangaCard className="bg-gradient-to-br from-pink-50 to-purple-50 border-t-4 border-t-pink-500 mb-8">
        {config.donationImage && (
          <div className="mb-6 -mx-6 -mt-6">
            <img
              src={config.donationImage}
              alt="Imagen de la campaña de donación"
              className="w-full h-64 object-cover border-b-2 border-black"
            />
          </div>
        )}

        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl mb-4 text-pink-700">
            ¿A dónde van las donaciones?
          </h2>
          <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
            {donationDescription}
          </p>
        </div>

        <div className="bg-white p-6 border-2 border-black shadow-manga mb-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <Heart className="text-pink-500" size={24} />
            Formas de Donar
          </h3>

          <div className="space-y-6">
            {/* Datos bancarios fijos */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Columna izquierda: Datos bancarios */}
              <div className="space-y-3">
                <div
                  className="bg-gray-50 p-4 border-2 border-gray-300 rounded cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all group relative"
                  onClick={handleCopyCBU}
                  title="Click para copiar"
                >
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center justify-between">
                    <span>CBU</span>
                    {copiedCBU ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} className="text-gray-400 group-hover:text-gray-600" />
                    )}
                  </p>
                  <p className="font-mono text-sm font-bold">{copiedCBU ? '¡Copiado!' : '4530000800012291620067'}</p>
                </div>

                <div
                  className="bg-gray-50 p-4 border-2 border-gray-300 rounded cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all group relative"
                  onClick={handleCopyAliasFixed}
                  title="Click para copiar"
                >
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center justify-between">
                    <span>Alias</span>
                    {copiedAlias ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} className="text-gray-400 group-hover:text-gray-600" />
                    )}
                  </p>
                  <p className="font-mono text-lg font-bold text-torami-red">{copiedAlias ? '¡Copiado!' : 'toramifest.nx'}</p>
                </div>

                <div className="bg-gray-50 p-4 border-2 border-gray-300 rounded">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Caja de ahorro en pesos</p>
                  <p className="font-mono text-sm font-bold">1229162006</p>
                </div>

                <div className="bg-gray-50 p-4 border-2 border-gray-300 rounded">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Titular</p>
                  <p className="text-sm font-bold">Alexis Sebastian Falcon</p>
                </div>

                <div className="bg-gray-50 p-4 border-2 border-gray-300 rounded">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">CUIL</p>
                  <p className="font-mono text-sm font-bold">20351190052</p>
                </div>

                <div className="bg-purple-100 p-4 border-2 border-purple-400 rounded">
                  <p className="text-sm font-bold text-purple-700 flex items-center gap-2">
                    <Heart size={16} className="fill-current" />
                    Naranja X
                  </p>
                </div>
              </div>

              {/* Columna derecha: Código QR */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm font-bold mb-3 text-gray-600">Escaneá el código QR</p>
                <div className="bg-white p-4 border-2 border-black shadow-manga">
                  <img
                    src="/donacionQR.png"
                    alt="Código QR para donaciones"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Escaneá con tu app de banco o MercadoPago
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
          <p className="text-yellow-800">
            <strong>Importante:</strong> Todas las donaciones recaudadas durante el evento se destinan
            íntegramente a las causas benéficas indicadas. Torami Fest no retiene ningún porcentaje.
          </p>
        </div>
      </MangaCard>

      {/* Recent Donors List */}
      {stats && stats.recent && stats.recent.length > 0 && (
        <MangaCard className="border-t-4 border-t-purple-500">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-purple-600" size={28} />
            <h2 className="font-display text-3xl text-purple-700">Donantes Recientes</h2>
          </div>

          <div className="space-y-3">
            {stats.recent.map((donation) => (
              <div
                key={donation.id}
                className="bg-white p-4 border-2 border-gray-200 rounded-lg flex items-start justify-between hover:border-purple-300 transition-colors"
              >
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="text-pink-500 fill-current" size={16} />
                    <span className="font-bold text-lg">
                      {donation.isAnonymous ? 'Donante Anónimo' : donation.donorName || 'Donante Anónimo'}
                    </span>
                  </div>
                  {donation.message && (
                    <p className="text-sm text-gray-600 italic ml-6">"{donation.message}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 ml-6">
                    {new Date(donation.createdAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-2xl text-green-600">
                    ${donation.amount.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {stats.count > stats.recent.length && (
            <p className="text-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
              Y {stats.count - stats.recent.length} donación{stats.count - stats.recent.length !== 1 ? 'es' : ''} más...
              ¡Gracias a todos!
            </p>
          )}
        </MangaCard>
      )}
    </div>
  );
};

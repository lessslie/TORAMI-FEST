import React, { useEffect, useState } from 'react';
import { SectionTitle, MangaCard, Button, Countdown } from '../components/UI';
import { getConfig, getActiveGiveaway, participateInGiveaway, checkGiveawayDni } from '../services/data';
import { Giveaway, CreateGiveawayParticipantDto } from '../types';
import { Gift, Sparkles, CheckCircle, Calendar, Users, AlertCircle, Loader2 } from 'lucide-react';

export const Giveaways = () => {
    const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
    const [loading, setLoading] = useState(true);
    const [inscripcionesAbiertas, setInscripcionesAbiertas] = useState<boolean | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dniChecking, setDniChecking] = useState(false);
    const [dniRegistered, setDniRegistered] = useState(false);

    const [formData, setFormData] = useState<CreateGiveawayParticipantDto>({
        fullName: '',
        birthDate: '',
        dni: '',
        whatsapp: '',
        email: '',
        instagram: '',
    });

    useEffect(() => {
        Promise.all([
            getActiveGiveaway(),
            getConfig()
        ]).then(([activeGiveaway, config]) => {
            setGiveaway(activeGiveaway);
            setInscripcionesAbiertas(config.giveawaysInscripcionesAbiertas !== false);
        }).catch(() => {
            setInscripcionesAbiertas(true);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    // Verificar DNI cuando cambia
    useEffect(() => {
        if (formData.dni.length >= 7 && giveaway) {
            const timeoutId = setTimeout(async () => {
                setDniChecking(true);
                try {
                    const result = await checkGiveawayDni(giveaway.id, formData.dni);
                    setDniRegistered(result.isRegistered);
                } catch {
                    setDniRegistered(false);
                } finally {
                    setDniChecking(false);
                }
            }, 500);
            return () => clearTimeout(timeoutId);
        } else {
            setDniRegistered(false);
        }
    }, [formData.dni, giveaway]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!giveaway) return;
        if (dniRegistered) {
            setError('Este DNI ya se encuentra registrado en este sorteo');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await participateInGiveaway(giveaway.id, formData);
            setSubmitted(true);
        } catch (err: any) {
            const message = err.message || 'Error al inscribirse';
            try {
                const parsed = JSON.parse(message);
                setError(parsed.message || message);
            } catch {
                setError(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-torami-red" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <SectionTitle>
                <span className="flex items-center gap-2">
                    <Gift className="text-torami-red animate-bounce-slow" /> Sorteos
                </span>
            </SectionTitle>

            {inscripcionesAbiertas === false ? (
                <MangaCard className="text-center py-16 bg-gradient-to-br from-gray-100 to-gray-200">
                    <Gift className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                    <h3 className="font-display text-4xl md:text-5xl mb-4 text-gray-800">INSCRIPCIONES CERRADAS</h3>
                    <p className="text-lg text-gray-600 mb-6">Los sorteos estan cerrados por ahora.</p>
                </MangaCard>
            ) : !giveaway ? (
                <MangaCard className="text-center py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
                    <Gift className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                    <h3 className="font-display text-4xl md:text-5xl mb-4 text-gray-800">PROXIMAMENTE</h3>
                    <p className="text-lg text-gray-600 mb-6">Estamos preparando sorteos increibles para vos</p>
                    <div className="flex justify-center gap-2">
                        <Sparkles className="text-yellow-500" size={20} />
                        <Sparkles className="text-orange-500" size={24} />
                        <Sparkles className="text-yellow-500" size={20} />
                    </div>
                </MangaCard>
            ) : submitted ? (
                <MangaCard className="text-center py-16 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CheckCircle className="w-24 h-24 mx-auto mb-6 text-green-500" />
                    <h3 className="font-display text-4xl md:text-5xl mb-4 text-green-800">INSCRIPCION EXITOSA</h3>
                    <p className="text-lg text-gray-600 mb-6">Ya estas participando en el sorteo "{giveaway.title}"</p>
                    <p className="text-sm text-gray-500">Te notificaremos si resultas ganador/a</p>
                </MangaCard>
            ) : (
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Info del sorteo */}
                    <MangaCard className="h-fit">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-yellow-400 p-3 rounded-full border-2 border-black">
                                <Gift className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="font-display text-2xl md:text-3xl">{giveaway.title}</h2>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users size={14} />
                                    <span>{giveaway._count?.participants || 0} participantes</span>
                                </div>
                            </div>
                        </div>

                        {giveaway.description && (
                            <p className="text-gray-600 mb-6">{giveaway.description}</p>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={16} className="text-gray-500" />
                                <span className="font-bold text-sm uppercase text-gray-500">Fechas del sorteo</span>
                            </div>
                            <p className="text-sm">
                                <span className="font-medium">Inicio:</span> {formatDate(giveaway.startDate)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Cierre:</span> {formatDate(giveaway.endDate)}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-xs font-bold uppercase text-gray-400 mb-2">Cierra en</p>
                            <Countdown targetDate={`${giveaway.endDate}T23:59:59`} />
                        </div>
                    </MangaCard>

                    {/* Formulario */}
                    <MangaCard>
                        <h3 className="font-display text-xl mb-6 flex items-center gap-2">
                            <Sparkles className="text-yellow-500" size={20} />
                            Completa tus datos para participar
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">
                                    Nombre Completo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    placeholder="Ej: Juan Perez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">
                                    Fecha de Nacimiento <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">
                                    DNI <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="dni"
                                        value={formData.dni}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none ${
                                            dniRegistered ? 'border-red-500 bg-red-50' : 'border-black'
                                        }`}
                                        placeholder="Ej: 12345678"
                                    />
                                    {dniChecking && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                                    )}
                                </div>
                                {dniRegistered && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle size={14} /> Este DNI ya esta registrado
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">
                                    WhatsApp <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    placeholder="Ej: 1123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    placeholder="Ej: juanperez@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">
                                    Instagram <span className="text-gray-400 font-normal">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="instagram"
                                    value={formData.instagram}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    placeholder="Ej: @juanperez"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={submitting || dniRegistered}
                                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Inscribiendo...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Quiero Participar
                                    </>
                                )}
                            </Button>
                        </form>
                    </MangaCard>
                </div>
            )}
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { SectionTitle, MangaCard, Badge, Button, Countdown } from '../components/UI';
import { getGiveaways, participateInGiveaway } from '../services/data';
import { Giveaway } from '../types';
import { useAuth } from '../App';
import { Gift, Sparkles, CheckCircle, Calendar, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Giveaways = () => {
    const { user } = useAuth();
    const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
    const [participatedIds, setParticipatedIds] = useState<string[]>([]);

    useEffect(() => {
        getGiveaways().then(setGiveaways);
    }, []);

    // Check participation on load
    useEffect(() => {
        if(user && giveaways.length > 0) {
            const participated = giveaways
                .filter(g => g.participantIds.includes(user.id))
                .map(g => g.id);
            setParticipatedIds(participated);
        }
    }, [user, giveaways]);

    const handleParticipate = async (id: string) => {
        if (!user) return;
        const success = await participateInGiveaway(id, user.id);
        if (success) {
            setParticipatedIds(prev => [...prev, id]);
            // Refresh counts
            getGiveaways().then(setGiveaways);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <SectionTitle>
                <span className="flex items-center gap-2">
                    <Gift className="text-torami-red animate-bounce-slow" /> Sorteos Activos
                </span>
            </SectionTitle>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {giveaways.filter(g => g.status === 'Activo').map(g => (
                    <MangaCard key={g.id} className="relative overflow-hidden flex flex-col h-full group">
                        <div className="absolute top-0 right-0 bg-yellow-400 text-black font-bold text-xs px-3 py-1 z-10 border-l-2 border-b-2 border-black">
                            {g.participantIds.length} Participantes
                        </div>
                        
                        <div className="h-48 bg-gray-200 border-2 border-black mb-4 overflow-hidden relative">
                             {g.images && g.images[0] ? (
                                <img src={g.images[0]} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <Gift size={48} className="text-gray-300" />
                                </div>
                             )}
                        </div>

                        <h3 className="font-display text-2xl mb-2">{g.title}</h3>
                        <p className="text-gray-600 mb-4 flex-grow">{g.description}</p>
                        
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                            <p className="text-sm font-bold flex items-center gap-2 mb-1">
                                <Trophy size={16} className="text-yellow-500" /> Premio:
                            </p>
                            <p className="text-sm">{g.prize}</p>
                        </div>
                        
                        <div className="text-center mb-4">
                             <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Cierra en</p>
                             <Countdown targetDate={`${g.endDate}T23:59:59`} />
                        </div>

                        {user ? (
                            participatedIds.includes(g.id) ? (
                                <div className="bg-green-100 text-green-800 p-3 border-2 border-green-500 font-bold text-center flex items-center justify-center gap-2">
                                    <CheckCircle size={20} /> ¡Ya estás participando!
                                </div>
                            ) : (
                                <Button onClick={() => handleParticipate(g.id)} className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-600">
                                    <Sparkles size={18} /> ¡Quiero Participar!
                                </Button>
                            )
                        ) : (
                            <Link to="/dashboard">
                                <Button variant="outline" className="w-full border-gray-400 text-gray-500 hover:border-black hover:text-black">
                                    Inicia sesión para participar
                                </Button>
                            </Link>
                        )}
                    </MangaCard>
                ))}
            </div>

            {giveaways.some(g => g.status === 'Finalizado') && (
                <div className="mt-16">
                    <h3 className="font-display text-2xl mb-6 text-gray-500 uppercase">Sorteos Finalizados</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                         {giveaways.filter(g => g.status === 'Finalizado').map(g => (
                             <MangaCard key={g.id} className="bg-gray-100">
                                 <div className="flex justify-between items-start mb-2">
                                     <h4 className="font-bold text-lg">{g.title}</h4>
                                     <Badge color="purple">Finalizado</Badge>
                                 </div>
                                 <p className="text-sm text-gray-600 mb-2">Premio: {g.prize}</p>
                                 {g.winner && (
                                     <div className="bg-yellow-100 border border-yellow-300 p-2 text-center">
                                         <p className="text-xs font-bold uppercase text-yellow-700">Ganador/a</p>
                                         <p className="font-display text-lg">{g.winner}</p>
                                     </div>
                                 )}
                             </MangaCard>
                         ))}
                    </div>
                </div>
            )}
        </div>
    );
};

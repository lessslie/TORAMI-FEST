import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MangaCard, Input, Button } from '../components/UI';
import { useAuth } from '../App';
import { Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';

export const RecoverPassword = () => {
  const { recoverPassword } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    
    try {
      await recoverPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError('Hubo un error al procesar tu solicitud. Verifica el email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <MangaCard className="p-8 border-4 border-black relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-4 shadow-manga">
                <KeyRound size={32} className="text-black" />
            </div>
            <h2 className="font-display text-2xl uppercase">¿Olvidaste tu clave?</h2>
            <p className="text-gray-500 text-sm mt-2">No te preocupes nakama, ingresá tu email y te enviaremos las instrucciones.</p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label="Email registrado" 
                type="email" 
                placeholder="ejemplo@correo.com" 
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div className="bg-red-50 text-red-600 p-3 text-sm font-bold border border-red-200 text-center">
                    {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperación'} <Mail size={18} />
              </Button>
            </form>
          ) : (
            <div className="text-center animate-in fade-in zoom-in-95">
                <div className="bg-green-100 text-green-800 p-4 border-2 border-green-500 mb-6 rounded-lg">
                    <CheckCircle className="mx-auto mb-2 w-8 h-8" />
                    <p className="font-bold">¡Correo enviado!</p>
                    <p className="text-sm mt-1">Revisá tu bandeja de entrada (y spam) para resetear tu contraseña.</p>
                </div>
                <Link to="/reset-password">
                    <button className="text-xs text-gray-400 underline hover:text-black mb-4">
                        (Demo: Ir directo a pantalla Reset)
                    </button>
                </Link>
            </div>
          )}

          <div className="mt-8 text-center border-t border-gray-200 pt-4">
            <Link to="/login" className="text-sm font-bold hover:text-torami-red flex items-center justify-center gap-2 transition-colors">
               <ArrowLeft size={16} /> Volver al Login
            </Link>
          </div>
        </MangaCard>
      </div>
    </div>
  );
};

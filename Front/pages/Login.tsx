import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SectionTitle, MangaCard, Input, Button } from '../components/UI';
import { useAuth } from '../App';
import { LogIn, Sparkles, Ghost, ArrowRight } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginWithCredentials(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas (Intenta cualquier email por ahora)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {/* Decorative elements */}
        <Ghost className="absolute -top-10 -left-10 text-gray-200 w-24 h-24 -rotate-12 animate-pulse" />
        
        <MangaCard className="bg-white border-4 border-black relative z-10 p-8 shadow-[8px_8px_0px_0px_#D70000]">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl mb-2 flex items-center justify-center gap-2">
              <LogIn className="text-torami-red" /> Ingresar
            </h2>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Bienvenido de nuevo, Nakama</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Email" 
              name="email" 
              type="email" 
              required 
              placeholder="tu@email.com" 
              value={formData.email}
              onChange={handleChange}
            />
            
            <div className="relative">
              <Input 
                label="Contraseña" 
                name="password" 
                type="password" 
                required 
                placeholder="******" 
                value={formData.password}
                onChange={handleChange}
              />
              <Link to="/recuperar-password">
                  <span className="absolute top-0 right-0 text-xs text-blue-600 hover:underline cursor-pointer">
                      ¿Olvidaste tu contraseña?
                  </span>
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 border border-red-200 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className={`w-full py-4 text-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'} <ArrowRight size={20} />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300 text-center">
            <p className="text-sm mb-2">¿Aún no tienes cuenta?</p>
            <Link to="/registro">
              <span className="font-display text-xl text-torami-red hover:text-black transition-colors underline decoration-2 underline-offset-4 cursor-pointer flex items-center justify-center gap-2">
                <Sparkles size={18} /> ¡Registrate Gratis!
              </span>
            </Link>
          </div>
        </MangaCard>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MangaCard, Input, Button } from '../components/UI';
import { useAuth } from '../App';
import { Lock, CheckCircle, Save, AlertTriangle } from 'lucide-react';

interface ResetState {
    password: string;
    confirm: string;
}

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [formData, setFormData] = useState<ResetState>({ password: '', confirm: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // TODO: obtener token real desde query param

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      setError(''); // Clear error on type
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
        setError('Las contraseñas no coinciden.');
        return;
    }
    if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    setLoading(true);
    
    try {
      // TODO: obtener token real desde query param
      await resetPassword('123', formData.password);
      setSuccess(true);
      setTimeout(() => {
          navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError('Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <MangaCard className="max-w-md w-full text-center py-12 border-green-600 border-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-600 animate-bounce">
                    <CheckCircle size={40} className="text-green-600" />
                </div>
                <h2 className="font-display text-3xl mb-2">¡Contraseña Actualizada!</h2>
                <p className="text-gray-600 mb-6">Ya puedes ingresar con tu nueva clave.</p>
                <Link to="/login">
                    <Button className="bg-green-600 hover:bg-green-700 border-green-800 text-white">Ir al Login</Button>
                </Link>
            </MangaCard>
        </div>
      );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <MangaCard className="p-8 border-4 border-black relative">
          <div className="absolute -top-6 -left-6 bg-torami-red text-white p-3 border-2 border-black shadow-sm transform -rotate-6">
              <Lock size={24} />
          </div>

          <div className="text-center mb-8 mt-4">
            <h2 className="font-display text-2xl uppercase">Nueva Contraseña</h2>
            <p className="text-gray-500 text-sm mt-1">Ingresa una clave segura para tu cuenta.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Nueva Contraseña" 
              name="password"
              type="password" 
              placeholder="******" 
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <Input 
              label="Confirmar Contraseña" 
              name="confirm"
              type="password" 
              placeholder="******" 
              value={formData.confirm}
              onChange={handleChange}
              required
            />

            {error && (
              <div className="bg-red-50 text-red-600 p-3 text-sm font-bold border border-red-200 flex items-center gap-2 justify-center">
                  <AlertTriangle size={16} /> {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Cambiar Contraseña'} <Save size={18} />
            </Button>
          </form>
        </MangaCard>
      </div>
    </div>
  );
};

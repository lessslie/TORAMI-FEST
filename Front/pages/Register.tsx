import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SectionTitle, MangaCard, Input, Button } from '../components/UI';
import { useAuth } from '../App';
import { UserPlus, Info, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors on change
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name) newErrors.name = 'El nombre es obligatorio';
    if (!formData.email) newErrors.email = 'El email es obligatorio';
    if (!formData.age) newErrors.age = 'La edad es obligatoria';
    if (parseInt(formData.age) < 5 || parseInt(formData.age) > 100) newErrors.age = 'Edad inválida';
    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Enviar solo los campos que el backend acepta (sin confirmPassword)
      const { confirmPassword, ...registerData } = formData;

      // Convertir age a número si existe
      const dataToSend = {
        ...registerData,
        age: registerData.age ? parseInt(registerData.age as string) : undefined
      };

      await register(dataToSend);
      setLoading(false);
      navigate('/dashboard');
    } catch (error) {
      setLoading(false);
      console.error('Registration error:', error);
      setErrors({ form: 'Error al registrar. Verifica los datos e intenta nuevamente.' });
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 flex justify-center items-start">
      <div className="w-full max-w-2xl">
        <MangaCard className="bg-white border-2 border-black p-0 overflow-hidden shadow-manga">
          {/* Header */}
          <div className="bg-black text-white p-6 border-b-2 border-black relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
             <h2 className="font-display text-3xl relative z-10 flex items-center gap-3">
               <UserPlus className="text-torami-red" /> Ficha de Registro
             </h2>
             <p className="text-gray-400 text-sm mt-1 relative z-10">Unite a la comunidad de Torami Fest</p>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <Input 
                  label="Nombre y Apellido" 
                  name="name" 
                  required 
                  placeholder="Ej. Goku Son" 
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                />
                <Input 
                  label="Email" 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="otaku@mail.com" 
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />
              </div>

              {/* Age Section with Explanation */}
              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg relative">
                 <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="w-full md:w-1/3">
                        <Input 
                          label="Edad" 
                          name="age" 
                          type="number" 
                          required 
                          placeholder="Ej. 25" 
                          value={formData.age}
                          onChange={handleChange}
                          error={errors.age}
                        />
                    </div>
                    <div className="flex-1 text-sm text-blue-900">
                        <p className="font-bold flex items-center gap-2 mb-1">
                            <Info size={16} /> ¿Por qué pedimos esto?
                        </p>
                        <p className="opacity-80 leading-snug">
                            Es necesario para identificar si puedes inscribirte a torneos con restricción de edad (+16/+18) o si necesitas acompañante. ¡No te preocupes, es confidencial!
                        </p>
                    </div>
                 </div>
              </div>

              <Input 
                label="Celular (Opcional)" 
                name="phone" 
                type="tel" 
                placeholder="+54 9 11..." 
                value={formData.phone}
                onChange={handleChange}
              />

              <div className="border-t-2 border-dashed border-gray-300 my-6"></div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input 
                  label="Contraseña" 
                  name="password" 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                />
                <Input 
                  label="Verificar Contraseña" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full py-4 text-lg bg-torami-red hover:bg-red-700 text-white shadow-lg flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : '¡Crear Cuenta!'} <CheckCircle size={20} />
              </Button>

              <div className="flex items-start gap-2 text-sm bg-yellow-50 border-2 border-yellow-200 text-yellow-900 p-3 rounded-lg">
                <AlertTriangle size={18} className="mt-0.5 text-yellow-600" />
                <p>
                  Si no ves el correo de bienvenida, revisa tu carpeta de spam o promociones. A veces puede tardar unos minutos en llegar.
                </p>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
                ¿Ya tienes cuenta? <Link to="/login" className="font-bold text-blue-600 hover:underline">Iniciar Sesión</Link>
            </div>
          </div>
        </MangaCard>
      </div>
    </div>
  );
};

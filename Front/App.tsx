import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { EventsList, EventDetail } from './pages/Events';
import { StandForm } from './pages/StandForm';
import { CosplayContest } from './pages/CosplayContest';
import { Admin } from './pages/Admin';
import { UserDashboard } from './pages/UserDashboard';
import { Gallery } from './pages/Gallery';
import { Giveaways } from './pages/Giveaways';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RecoverPassword } from './pages/RecoverPassword';
import { ResetPassword } from './pages/ResetPassword';
import { About } from './pages/About';
import { User, UserRole, AppConfig } from './types';
import { SectionTitle, MangaCard, Button } from './components/UI';
import { getConfig, requestPasswordRecovery, resetPassword as apiResetPassword } from './services/data';
import { api } from './services/api';
import { Copy, Check, ExternalLink } from 'lucide-react';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void; // Legacy demo login
  loginWithCredentials: (email: string, pass: string) => Promise<boolean>;
  register: (userData: any) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const AUTH_KEY = 'torami_auth';

  // Load auth from localstorage
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    const legacyUser = localStorage.getItem('torami_user'); // cleanup
    if (legacyUser) localStorage.removeItem('torami_user');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setToken(parsed.token);
        setUser(parsed.user);
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (token && !user) {
      api
        .me(token)
        .then((u) => setUser(u))
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem(AUTH_KEY);
        });
    }
  }, [token, user]);

  // Placeholder: use loginWithCredentials for real auth
  const login = (_role: UserRole) => {};

  // Simulated Real Login
  const loginWithCredentials = async (email: string, pass: string) => {
      const res = await api.login(email, pass);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: res.user, token: res.token }));
      return true;
  };

  // Simulated Register
  const register = async (userData: any) => {
      const res = await api.register(userData);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: res.user, token: res.token }));
  };

  const recoverPassword = async (email: string) => {
      await requestPasswordRecovery(email);
  };

  const resetPassword = async (token: string, newPass: string) => {
      await apiResetPassword(token, newPass);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, register, recoverPassword, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Placeholder Pages ---
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="max-w-7xl mx-auto px-4 py-12">
    <SectionTitle>{title}</SectionTitle>
    <MangaCard className="p-8 text-center bg-gray-50">
      <p className="text-gray-500">Próximamente... </p>
    </MangaCard>
  </div>
);

const Donations = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  const handleCopy = () => {
    if (config?.aliasCbu) {
      navigator.clipboard.writeText(config.aliasCbu);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!config) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <SectionTitle>Apoyá Torami Fest</SectionTitle>
      <MangaCard className="border-t-4 border-t-torami-red">
        <p className="mb-6 text-gray-700">Tus donaciones nos ayudan a traer mejores invitados, premios y a mantener la calidad del evento.</p>
        
        {config.qrImage && (
           <div className="bg-white w-48 h-48 mx-auto mb-6 flex items-center justify-center border-2 border-black p-2 shadow-sm">
             <img src={config.qrImage} alt="QR Code" className="w-full h-full object-contain" />
           </div>
        )}

        {/* Dynamic Payment Link Button */}
        {config.paymentLink && (
           <a href={config.paymentLink} target="_blank" rel="noreferrer" className="block mb-4">
             <button className="bg-blue-500 text-white font-bold py-3 px-8 rounded border-2 border-black shadow-manga hover:bg-blue-600 hover:shadow-manga-hover transition-all w-full flex items-center justify-center gap-2 transform active:scale-95">
               Donar con MercadoPago <ExternalLink size={18} />
             </button>
           </a>
        )}

        {/* Dynamic Alias/CBU Display */}
        {config.aliasCbu && (
           <div className="mt-6 bg-gray-100 p-4 rounded border border-gray-300">
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Alias / CBU</p>
              <div className="flex items-center gap-2">
                 <code className="flex-grow bg-white border border-gray-300 p-2 font-mono text-lg rounded text-center select-all">
                    {config.aliasCbu}
                 </code>
                 <button 
                    onClick={handleCopy}
                    className="p-2 bg-white border border-black rounded hover:bg-gray-50 transition-colors"
                    title="Copiar"
                 >
                    {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                 </button>
              </div>
              {copied && <p className="text-green-600 text-xs font-bold mt-2">¡Copiado al portapapeles!</p>}
           </div>
        )}

        {!config.paymentLink && !config.aliasCbu && (
            <p className="text-gray-500 italic mt-4">No hay métodos de pago configurados por el momento.</p>
        )}
      </MangaCard>
    </div>
  );
};

// --- Main App ---
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/recuperar-password" element={<RecoverPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/proximos-eventos" element={<EventsList />} />
            <Route path="/eventos/:id" element={<EventDetail />} />
            <Route path="/quiero-un-stand" element={<StandForm />} />
            <Route path="/concursos-cosplay" element={<CosplayContest />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/sorteos" element={<Giveaways />} />
            
            <Route path="/eventos-pasados" element={<PlaceholderPage title="Eventos Pasados" />} />
            <Route path="/sponsors" element={<PlaceholderPage title="Nuestros Sponsors" />} />
            <Route path="/donar" element={<Donations />} />
            <Route path="/contacto" element={<PlaceholderPage title="Contacto" />} />
            <Route path="/sobre" element={<About />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
